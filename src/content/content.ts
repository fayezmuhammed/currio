/**
 * Content-script entry. Kept deliberately small: no framework, no page
 * scanning, only a few passive listeners until the user selects something.
 */
import { TEARDOWN_EVENT, startCurrio } from './controller';

// A previous copy (from before an update, or a duplicate injection) shuts itself down.
document.dispatchEvent(new CustomEvent(TEARDOWN_EVENT));
startCurrio();
