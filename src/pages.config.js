import Home from './pages/Home';
import Kalendarz from './pages/Kalendarz';
import Raporty from './pages/Raporty';
import RaportyFinansowe from './pages/RaportyFinansowe';
import RaportRoczny from './pages/RaportRoczny';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Kalendarz": Kalendarz,
    "Raporty": Raporty,
    "RaportyFinansowe": RaportyFinansowe,
    "RaportRoczny": RaportRoczny,
}

export const pagesConfig = {
    mainPage: "Kalendarz",
    Pages: PAGES,
    Layout: __Layout,
};