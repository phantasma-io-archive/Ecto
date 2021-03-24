import { Locales } from "./locales";

import en from "../locales/en.json";
import fr from "../locales/fr.json";
import it from "../locales/it.json";
import es from "../locales/es.json";
import cn from "../locales/cn.json";
import nl from "../locales/nl.json";
import de from "../locales/de.json";
import tr from "../locales/tr.json";
import ru from "../locales/ru.json";
import vn from "../locales/vn.json";
import nb from "../locales/nb.json";
import pt from "../locales/pt.json";

export const messages = {
  [Locales.EN]: en,
  [Locales.FR]: fr,
  [Locales.IT]: it,
  [Locales.ES]: es,
  [Locales.CN]: cn,
  [Locales.NL]: nl,
  [Locales.DE]: de,
  [Locales.TR]: tr,
  [Locales.RU]: ru,
  [Locales.VN]: vn,
  [Locales.NB]: nb,
  [Locales.PT]: pt
};

export const defaultLocale = Locales.EN;