interface PriorityFunction extends Function {
    _priority: number;
}
/**
 * Function with a added priority type
 * @typedef {Function} PriorityFunction
 * @property {number} _priority
 */
/**
 * Generic event dispatcher
 * @class  BellhopEventDispatcher
 */
declare class BellhopEventDispatcher {
    private _listeners;
    /**
     *  Add an event listener to listen to an event from either the parent or iframe
     *  @method on
     *  @param {String} name The name of the event to listen for
     *  @param {PriorityFunction} callback The handler when an event is triggered
     *  @param {number} [priority=0] The priority of the event listener. Higher numbers are handled first.
     */
    on(name: string, callback: any, priority?: number): void;
    /**
     *  Sorts listeners added by .on() by priority
     * @private
     * @param {PriorityFunction} a
     * @param {PriorityFunction} b
     * @returns {number};
     */
    listenerSorter(a: PriorityFunction, b: PriorityFunction): number;
    /**
     *  Remove an event listener
     *  @method off
     *  @param {String} name The name of event to listen for. If undefined, remove all listeners.
     *  @param {Function} [callback] The optional handler when an event is triggered, if no callback
     *         is set then all listeners by type are removed
     */
    off(name: string, callback: Function): void;
    /**
     *  Trigger any event handlers for an event type
     *  @method trigger
     *  @param {object | String} event The event to send
     *  @param {object} [data = {}] optional data to send to other areas in the app that are listening for this event
     */
    trigger(event: any, data?: {}): void;
    /**
     * Reset the listeners object
     * @method  destroy
     */
    destroy(): void;
}

export { BellhopEventDispatcher, type PriorityFunction };
