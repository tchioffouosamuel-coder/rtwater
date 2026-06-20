import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import { CartProvider } from "./context/CartContext";
import { CartUIProvider } from "./context/CartUIContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { InventoryProvider } from "./context/InventoryContext";
import { POSProvider } from "./context/POSContext";
import { ReceiptProvider } from "./context/ReceiptContext";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <I18nProvider>
        <CartProvider>
          <CartUIProvider>
            <AdminAuthProvider>
              <UserAuthProvider>
                <InventoryProvider>
                  <POSProvider>
                    <ReceiptProvider>
                      <App />
                    </ReceiptProvider>
                  </POSProvider>
                </InventoryProvider>
              </UserAuthProvider>
            </AdminAuthProvider>
          </CartUIProvider>
        </CartProvider>
      </I18nProvider>
    </ThemeProvider>
  </BrowserRouter>
);
