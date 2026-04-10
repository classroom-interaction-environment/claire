/*------------------------------------------
 | Bootstrapping code is executed at the very
 | last stage of the server startup process,
 | after all other components are loaded without errors.
 | This is important because failure in any
 | of these components can potentially
 | render the system unusable.
 */
import "./admin";
