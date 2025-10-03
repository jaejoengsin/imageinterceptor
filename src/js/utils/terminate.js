import IMGObs from "../modules/imgObs";
import { setInterceptorActive } from "../global/contentConfig";

/**
 * 
 * @param {err} errMessage 
 */
export function terminateContentScript(errMessage) {
    if (/Extension context invalidated/i.test(errMessage)) console.error(" extension may be reloaded or disabled. so this contentscript can no longer be operated and will be termainated");
    else {
        console.error("!terminateContentScript becaouse this Error: ", errMessage, " !");
    }
    if (IMGObs) {
        IMGObs.disconntectObeserver();
        setInterceptorActive(false);
        console.log("program off");
    }
}

