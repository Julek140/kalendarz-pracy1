import Kalendarz from './pages/Kalendarz';
import Raporty from './pages/Raporty';
import RaportyFinansowe from './pages/RaportyFinansowe';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Kalendarz": Kalendarz,
    "Raporty": Raporty,
    "RaportyFinansowe": RaportyFinansowe,
}

export const pagesConfig = {
    mainPage: "Kalendarz",
    Pages: PAGES,
    Layout: __Layout,
};