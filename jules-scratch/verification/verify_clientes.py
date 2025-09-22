import re
import time
from playwright.sync_api import sync_playwright, expect

def run_test(page):
    print("Navigating to the app...")
    page.goto("http://localhost:5173")

    # Login
    print("Logging in...")
    expect(page.locator("#username")).to_be_visible(timeout=10000)
    page.locator("#username").fill("admin")
    page.locator("#password").fill("admin123")
    page.locator("button[type='submit']").click()
    print("Login successful.")

    # Navigate to clients page
    print("Navigating to clients page...")
    # The button is in a header, let's find it by text
    expect(page.locator("header").get_by_role("button", name="Clientes")).to_be_visible(timeout=10000)
    page.locator("header").get_by_role("button", name="Clientes").click()

    # Wait for the list to load
    print("Waiting for client list to load...")
    # We expect to see the main heading of the clients list page
    expect(page.locator("h1").get_by_text("Listado de Clientes")).to_be_visible(timeout=10000)
    print("Client list page loaded.")

    # Check if there are any client cards initially
    initial_cards = page.locator(".grid > div[class*='bg-white']")
    initial_count = initial_cards.count()
    print(f"Found {initial_count} client cards initially.")

    # Add a new client
    print("Adding a new client...")
    page.locator("button").get_by_text("Añadir Cliente").click()

    # Fill the modal form
    print("Filling out the new client form...")
    expect(page.locator("#nombre")).to_be_visible(timeout=5000)
    page.locator("#nombre").fill("Test Client")
    page.locator("#cif").fill("B12345678")
    page.locator("#telefono").fill("912345678")
    page.locator("#email").fill("test@client.com")
    page.locator("#direccion").fill("123 Test Street")

    # Click save
    page.locator("button").get_by_text("Guardar").click()
    print("Saving new client...")

    # Wait for the modal to close
    expect(page.locator("h2").get_by_text("Nuevo Cliente")).not_to_be_visible(timeout=5000)
    print("Modal closed.")

    time.sleep(2) # wait for UI to update

    # Verify the new client is in the list
    print("Verifying the new client is in the list...")
    new_cards = page.locator(".grid > div[class*='bg-white']")
    expect(new_cards).to_have_count(initial_count + 1, timeout=5000)

    new_client_card = page.locator("div.p-5 h3:has-text('Test Client')")
    expect(new_client_card).to_be_visible()
    print("New client found in the list.")

    print("Test passed!")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        run_test(page)
    except Exception as e:
        print(f"Test failed: {e}")
        page.screenshot(path="test-failure.png")
    finally:
        browser.close()
