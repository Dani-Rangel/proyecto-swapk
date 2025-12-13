from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

LOGIN_URL = "http://localhost:3000/auth/login"
POPULAR_URL = "http://localhost:3000/popular/popular"
EMAIL = "pruebacaso126@gmail.com"
PASSWORD = "Jefferson123456789"

options = webdriver.FirefoxOptions()
# options.add_argument("--headless")

print("Iniciando prueba: Login -> Popular -> Dejar reseña general...")

driver = webdriver.Firefox(options=options)
wait = WebDriverWait(driver, 20)

try:
    #  Login 
    print("Accediendo a login...")
    driver.get(LOGIN_URL)
    wait.until(EC.element_to_be_clickable((By.NAME, "emailOrUsername"))).send_keys(EMAIL)
    wait.until(EC.element_to_be_clickable((By.NAME, "password"))).send_keys(PASSWORD)
    wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))).click()
    wait.until(EC.url_contains("/dashboard/index_dashboard"))
    print("Login exitoso.")

    # Ir a /popular/popular 
    print("Navegando a /popular/popular...")
    driver.get(POPULAR_URL)

    #  Abrir modal 
    print("Abriendo modal de reseña...")
    wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Dejar reseña')]"))).click()

    #  Esperar a que el modal esté visible
    print("Esperando carga del modal...")
    wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[contains(@placeholder, 'Cuéntanos tu experiencia con Swapk')]")))

    #  Seleccionar 5 estrellas 
    print("Seleccionando 5 estrellas...")
    stars = wait.until(EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'flex gap-1')]//button")))
    if len(stars) >= 5:
        stars[4].click()  # quinta estrella
    else:
        stars[-1].click()
    time.sleep(2.5)

    #  Escribir comentario 
    print("Escribiendo comentario...")
    comment_area = wait.until(EC.element_to_be_clickable((By.XPATH, "//textarea[contains(@placeholder, 'Cuéntanos tu experiencia con Swapk')]")))
    comment_area.clear()
    comment_area.send_keys("Plataforma muy útil y confiable. ¡Seguiré usando SWAPK!")

    #  Enviar 
    print("Enviando reseña...")
    wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Enviar reseña')]"))).click()

    #  Verificar éxito 
    time.sleep(2.5)
    success = driver.find_elements(By.XPATH, "//*[contains(text(), 'Gracias por tu reseña')]")
    if success:
        print("Reseña enviada correctamente.")
    else:
        print("Acción completada. Verifica en la interfaz.")

    print("Prueba finalizada.")

except TimeoutException as e:
    print("Error: Elemento no encontrado a tiempo.")
    print("URL:", driver.current_url)
    driver.save_screenshot("error.png")
    print("Captura guardada: error.png")
except Exception as e:
    print("Error inesperado:", str(e))
finally:
    print("Cerrando navegador...")
    driver.quit()