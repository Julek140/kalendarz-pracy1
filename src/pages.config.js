import Home from './pages/Home';
import Kalendarz from './pages/Kalendarz';
import RaportRoczny from './pages/RaportRoczny';
import Raporty from './pages/Raporty';
import RaportyFinansowe from './pages/RaportyFinansowe';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Kalendarz": Kalendarz,
    "RaportRoczny": RaportRoczny,
    "Raporty": Raporty,
    "RaportyFinansowe": RaportyFinansowe,
}

export const pagesConfig = {
    mainPage: "Kalendarz",
    Pages: PAGES,
    Layout: __Layout,
};