/**
 * Wallet connection types for MultiWallet component testing
 * Supports KAIA blockchain and standard Web3 wallets
 */
export var ConnectionState;
(function (ConnectionState) {
    ConnectionState["DISCONNECTED"] = "disconnected";
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["ERROR"] = "error";
})(ConnectionState || (ConnectionState = {}));
