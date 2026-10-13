import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import { CartProvider } from "./context/CartContext";
import { CartUIProvider } from "./context/CartUIContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { SiteContentProvider } from "./context/SiteContentContext";
import { ShopMemoryProvider } from "./context/ShopMemoryContext";
import { POSProvider } from "./context/POSContext";
import { initAnalytics, initErrorReporting } from "./lib/monitoring";
import { registerServiceWorker } from "./lib/offline";
import App from "./app/App.tsx";
import "./styles/index.css";

initErrorReporting();
initAnalytics();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <I18nProvider>
        <CartProvider>
          <CartUIProvider>
            <AdminAuthProvider>
              <UserAuthProvider>
                <SiteContentProvider>
                  <ShopMemoryProvider>
                    <POSProvider>
                      <App />
                    </POSProvider>
                  </ShopMemoryProvider>
                </SiteContentProvider>
              </UserAuthProvider>
            </AdminAuthProvider>
          </CartUIProvider>
        </CartProvider>
      </I18nProvider>
    </ThemeProvider>
  </BrowserRouter>
);
