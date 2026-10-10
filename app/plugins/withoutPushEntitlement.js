const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Lipidly only schedules reminders on the phone; it never receives server push. expo-notifications
 * still asks for the push entitlement (aps-environment), which free Apple developer accounts can't
 * sign, so it is removed. Add it back when server push is needed (paid Apple Developer Program).
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
