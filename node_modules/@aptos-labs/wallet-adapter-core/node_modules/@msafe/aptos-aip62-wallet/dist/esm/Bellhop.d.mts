import { BellhopEventDispatcher } from './BellhopEventDispatcher.mjs';

/**
 *  Abstract communication layer between the iframe
 *  and the parent DOM
 *  @class Bellhop
 *  @extends BellhopEventDispatcher
 */
declare class Bellhop extends BellhopEventDispatcher {
    private id;
    private connected;
    private connecting;
    private isChild;
    private debug;
    private supported;
    private origin;
    private _sendLater;
    private iframe;
    /**
     * Creates an instance of Bellhop.
     * @memberof Bellhop
     * @param { string | number } id the id of the Bellhop instance
     */
    constructor(id?: number);
    /**
     *  The connection has been established successfully
     *  @event connected
     */
    /**
     *  Connection could not be established
     *  @event failed
     */
    /**
     *  Handle messages in the window
     *  @method receive
     *  @param { MessageEvent } message the post message received from another bellhop instance
     *  @private
     */
    receive(message: MessageEvent): void;
    /**
     * Handle the initial connected message
     * @memberof Bellhop
     * @param {object} message the message received from the other bellhop instance
     * @private
     */
    onConnectionReceived(message: object): void;
    /**
     *  Setup the connection
     *  @method connect
     *  @param {HTMLIFrameElement} iframe The iframe to communicate with. If no value is set, the assumption
     *         is that we're the child trying to communcate with our window.parent
     *  @param {String} [origin="*"] The domain to communicate with if different from the current.
     *  @return {Bellhop} Return instance of current object
     */
    connect(iframe?: HTMLIFrameElement, origin?: string): void;
    /**
     *  Disconnect if there are any open connections
     *  @method disconnect
     */
    disconnect(): void;
    /**
     *  Send an event to the connected instance
     *  @method send
     *  @param {string} type name/type of the event
     *  @param {*} [data = {}] Additional data to send along with event
     */
    send(type: string, data?: {}): void;
    /**
     *  A convenience method for sending and listening to create
     *  a singular link for fetching data. This is the same as calling send
     *  and then getting a response right away with the same event.
     *  @method fetch
     *  @param {String} event The name of the event
     *  @param {Function} callback The callback to call after, takes event object as one argument
     *  @param {Object} [data = {}] Optional data to pass along
     *  @param {Boolean} [runOnce=false] If we only want to fetch once and then remove the listener
     */
    fetch(event: string, callback: any, data?: {}, runOnce?: boolean): void;
    /**
     *  A convience method for listening to an event and then responding with some data
     *  right away. Automatically removes the listener
     *  @method respond
     *  @param {String} event The name of the event
     *  @param {Object | function | Promise | string} [data = {}] The object to pass back.
     *  	May also be a function; the return value will be sent as data in this case.
     *  @param {Boolean} [runOnce=false] If we only want to respond once and then remove the listener
     *
     */
    respond(event: string, data?: {}, runOnce?: boolean): void;
    /**
     * Send either the default log message or the callback provided if debug
     * is enabled
     * @method logDebugMessage
     */
    logDebugMessage(received: boolean | undefined, message: any): void;
    /**
     *  Destroy and don't use after this
     *  @method destroy
     */
    destroy(): void;
    /**
     *
     * Returns the correct parent element for Bellhop's context
     * @readonly
     * @memberof Bellhop
     */
    get target(): Window | null | undefined;
}

export { Bellhop };
