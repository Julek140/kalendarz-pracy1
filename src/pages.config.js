import Kalendarz from './pages/Kalendarz';
import Raporty from './pages/Raporty';
import Layout from './Layout.jsx';


export const PAGES = {
    "Kalendarz": Kalendarz,
    "Raporty": Raporty,
}

export const pagesConfig = {
    mainPage: "Kalendarz",
    Pages: PAGES,
    Layout: Layout,
};