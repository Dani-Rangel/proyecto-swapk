from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

# Configuración
LOGIN_URL = "http://localhost:3000/auth/login"
POPULAR_URL = "http://localhost:3000/popular/popular"  # ✅ Ruta correcta
EMAIL = "pruebacaso126@gmail.com"
PASSWORD = "Jefferson123456789"

options = webdriver.FirefoxOptions()
# options.add_argument("--headless")  # Descomenta si quieres modo sin interfaz

print("🚀 Iniciando prueba: Login + dejar reseña en /popular/popular...")

driver = webdriver.Firefox(options=options)
wait = WebDriverWait(driver, 15)

try:
    # === Paso 1: Login ===
    print("➡️ Accediendo a login...")
    driver.get(LOGIN_URL)
    wait.until(EC.presence_of_element_located((By.NAME, "emailOrUsername")))

    email_field = wait.until(EC.element_to_be_clickable((By.NAME, "emailOrUsername")))
    email_field.clear()
    email_field.send_keys(EMAIL)

    password_field = wait.until(EC.element_to_be_clickable((By.NAME, "password")))
    password_field.clear()
    password_field.send_keys(PASSWORD)

    login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
    login_button.click()

    wait.until(EC.url_contains("/dashboard/index_dashboard"))
    print("✅ Login exitoso.")

    # === Paso 2: Ir directamente a la página de Popular ===
    print("🔗 Navegando a /popular/popular...")
    driver.get(POPULAR_URL)

    # Esperar que cargue el botón "Dejar reseña"
    leave_review_btn = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Dejar reseña')]"))
    )
    print("📝 Página de Popular cargada. Abriendo modal de reseña...")
    leave_review_btn.click()

    # === Paso 3: Rellenar y enviar reseña ===
    print("✍️ Rellenando reseña...")

    # Escribir comentario
    comment_field = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//textarea[contains(@placeholder, 'Comentario')]"))
    )
    comment_field.clear()
    comment_field.send_keys("¡Excelente plataforma! Muy útil para intercambios.")

    # Enviar
    submit_btn = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Enviar reseña')]"))
    )
    print("📤 Enviando reseña...")
    submit_btn.click()

    # === Paso 4: Verificar resultado ===
    time.sleep(2)
    toast_success = driver.find_elements(By.XPATH, "//*[contains(text(), 'Reseña publicada') or contains(text(), 'Éxito')]")
    if toast_success:
        print("✅ ¡Reseña enviada correctamente!")
    else:
        print("⚠️ No se detectó mensaje de éxito, pero el envío pudo haberse completado.")

    print("🎉 Prueba completada.")

except TimeoutException as e:
    print("⏳ Timeout: Alguno de los elementos no apareció a tiempo.")
    print("   URL actual:", driver.current_url)
    # Opcional: guardar screenshot para depurar
    driver.save_screenshot("error_timeout.png")
    print("   Captura guardada como 'error_timeout.png'")
except Exception as e:
    print("💥 Error inesperado:", str(e))
    driver.save_screenshot("error_general.png")
finally:
    print("🔚 Cerrando navegador...")
    driver.quit()