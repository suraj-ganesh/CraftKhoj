import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Provenance from "./pages/Provenance";
import ArtisanProfile from "./pages/ArtisanProfile";
import Artisans from "./pages/Artisans";
import Workspace from "./pages/Workspace";
import DemoFlow from "./pages/DemoFlow";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/product/:id" component={ProductDetail} />
    <Route path="/provenance" component={Provenance} />
    <Route path="/artisans" component={Artisans} />
    <Route path="/artisan/:id" component={ArtisanProfile} />
    <Route path="/workspace" component={Workspace} />
    <Route path="/404" component={NotFound} />
    <Route path="/account" component={() => <DemoFlow fixedMode="account" />} />
    <Route path="/orders" component={() => <DemoFlow fixedMode="orders" />} />
    <Route path="/review" component={() => <DemoFlow fixedMode="review" />} />
    <Route path="/report" component={() => <DemoFlow fixedMode="report" />} />
    <Route path="/checkout" component={() => <DemoFlow fixedMode="checkout" />} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><CartProvider><Toaster /><Router /></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
