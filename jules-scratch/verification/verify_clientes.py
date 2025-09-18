import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Capture console messages
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    try:
        # 1. Login
        page.goto("http://localhost:5173/")
        page.get_by_label("Usuario").fill("admin")
        page.get_by_label("Contraseña").fill("admin123")

        page.get_by_role("button", name="Iniciar Sesión").click()

        # Wait for the main header to be visible, which indicates login was successful
        expect(page.get_by_role("heading", name="Planning Pigmea")).to_be_visible(timeout=10000)

        # 2. Navigate to Clientes section
        page.get_by_role("link", name="Clientes").click()

        # 3. Verify client list is displayed
        expect(page.get_by_role("heading", name="Listado de Clientes")).to_be_visible()

        # 4. Create a new client
        page.get_by_role("button", name="Añadir Cliente").click()

        # Fill the form
        page.get_by_label("Nombre").fill("Cliente de Prueba Playwright")
        page.get_by_label("CIF").fill("B12345678")
        page.get_by_label("Teléfono").fill("912345678")
        page.get_by_label("Email").fill("test@playwright.com")
        page.get_by_label("Dirección Fiscal").fill("Calle Falsa 123")
        page.get_by_label("Población").fill("Madrid")
        page.get_by_label("Código Postal").fill("28001")

        page.get_by_role("button", name="Guardar Cliente").click()

        # 5. Verify the new client appears in the list
        expect(page.get_by_text("Cliente de Prueba Playwright")).to_be_visible()
        expect(page.get_by_text("B12345678")).to_be_visible()

        # 6. Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
