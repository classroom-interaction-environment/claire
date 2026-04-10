/* global Facts */
import { UserUtils } from "../../../contexts/system/accounts/users/UserUtils";

Facts.setUserIdFilter((userId) => UserUtils.isAdmin(userId));
