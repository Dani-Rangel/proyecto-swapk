# fail-login-test.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

options = Options()
options.add_argument("--headless")

driver = webdriver.Firefox(options=options)
wait = WebDriverWait(driver, 10)

try:
    driver.get("http://localhost:3000/auth/login")
    wait.until(EC.presence_of_element_located((By.NAME, "emailOrUsername")))

    # Credenciales inválidas
    driver.find_element(By.NAME, "emailOrUsername").send_keys("email@falso.com")
    driver.find_element(By.NAME, "password").send_keys("clave123")
    driver.find_element(By.XPATH, "//button[@type='submit']").click()

    # Esperar explícitamente a que aparezca un mensaje de error
    try:
        error_element = wait.until(
            EC.presence_of_element_located((By.XPATH, "//p[contains(@class, 'text-red-500') and contains(text(), 'Error')]"))
        )
        print("✅ Mensaje de error detectado:", error_element.text)
    except TimeoutException:
        # Si no hay mensaje de error, revisar URL y contenido
        current_url = driver.current_url
        page_text = driver.find_element(By.TAG_NAME, "body").text
        print("❌ No se detectó mensaje de error.")
        print("   URL actual:", current_url)
        print("   Contenido de la página (fragmento):")
        print("   " + page_text[:300])  # primeros 300 caracteres

finally:
    driver.quit()