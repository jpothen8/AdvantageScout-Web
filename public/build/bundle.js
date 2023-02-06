
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config(options);
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const gameStage=writable(0);
    const liveGamepiece = writable("");
    const autoStack = writable([]);
    const teleStack = writable([]);



    const generalGameData=writable({
        scoutName: "Name",
        teamNum: 0,
        allianceColor: "blue"
    });

    const autoGameData = writable({
        startingLocation: "Select Starting Location",
        highConeSuccess: 0,
        highConeFail: 0,
        midConeSuccess: 0,
        midConeFail: 0,
        hybridConeSuccess: 0,
        hybridConeFail: 0,
        droppedCone: 0,
        highCubeSuccess: 0,
        highCubeFail: 0,
        midCubeSuccess: 0,
        midCubeFail: 0,
        hybridCubeSuccess: 0,
        hybridCubeFail: 0,
        droppedCube: 0,
        docked: false,
        balanced: false,
        mobility: false
    });

    const teleGameData = writable({
        highConeSuccess: 0,
        highConeFail: 0,
        midConeSuccess: 0,
        midConeFail: 0,
        hybridConeSuccess: 0,
        hybridConeFail: 0,
        droppedCone: 0,
        highCubeSuccess: 0,
        highCubeFail: 0,
        midCubeSuccess: 0,
        midCubeFail: 0,
        hybridCubeSuccess: 0,
        hybridCubeFail: 0,
        droppedCube: 0,
        docked: false,
        balanced: false,
    });

    const postGameData = writable({
        defenseDuration: 0,
        defenseRating: 0,
        recDefenseDuration: 0,
        driverRating: 0,
        intakeRating: 0,
        notes: ""
    });

    /* src\Login.svelte generated by Svelte v3.55.1 */

    const { console: console_1$5 } = globals;
    const file$m = "src\\Login.svelte";

    // (61:16) {:else}
    function create_else_block$5(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Blue";
    			attr_dev(button, "class", "btn btn-accent");
    			add_location(button, file$m, 61, 16, 2295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*changeColorDebounce*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(61:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:16) {#if $generalGameData["allianceColor"] === "red"}
    function create_if_block$7(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Red";
    			attr_dev(button, "class", "btn btn-error");
    			add_location(button, file$m, 59, 16, 2179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*changeColorDebounce*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(59:16) {#if $generalGameData[\\\"allianceColor\\\"] === \\\"red\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let div5;
    	let div4;
    	let div1;
    	let label0;
    	let span0;
    	let t5;
    	let input0;
    	let t6;
    	let div2;
    	let label1;
    	let span1;
    	let t8;
    	let input1;
    	let t9;
    	let label2;
    	let span2;
    	let t11;
    	let t12;
    	let div3;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$generalGameData*/ ctx[0]["allianceColor"] === "red") return create_if_block$7;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Advantage Scout";
    			t1 = space();
    			p = element("p");
    			p.textContent = "A mobile-first, easy to use, QR based, scouting application made by FRC 6328";
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "Your Name";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div2 = element("div");
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "Team #";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			label2 = element("label");
    			span2 = element("span");
    			span2.textContent = "Alliance Color";
    			t11 = space();
    			if_block.c();
    			t12 = space();
    			div3 = element("div");
    			button = element("button");
    			button.textContent = "Start Scouting";
    			attr_dev(h1, "class", "text-5xl font-bold");
    			add_location(h1, file$m, 36, 12, 983);
    			attr_dev(p, "class", "py-6");
    			add_location(p, file$m, 37, 12, 1048);
    			attr_dev(div0, "class", "text-center lg:text-left");
    			add_location(div0, file$m, 35, 8, 931);
    			attr_dev(span0, "class", "label-text");
    			add_location(span0, file$m, 43, 24, 1391);
    			attr_dev(label0, "class", "label");
    			add_location(label0, file$m, 42, 20, 1344);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "name");
    			attr_dev(input0, "class", "input input-bordered");
    			add_location(input0, file$m, 45, 20, 1484);
    			attr_dev(div1, "class", "form-control");
    			add_location(div1, file$m, 41, 16, 1296);
    			attr_dev(span1, "class", "label-text");
    			add_location(span1, file$m, 49, 24, 1732);
    			attr_dev(label1, "class", "label");
    			add_location(label1, file$m, 48, 20, 1685);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "team #");
    			attr_dev(input1, "class", "input input-bordered");
    			add_location(input1, file$m, 51, 20, 1822);
    			attr_dev(div2, "class", "form-control");
    			add_location(div2, file$m, 47, 16, 1637);
    			attr_dev(span2, "class", "label-text");
    			add_location(span2, file$m, 55, 20, 2020);
    			attr_dev(label2, "class", "label");
    			add_location(label2, file$m, 54, 16, 1977);
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$m, 65, 20, 2466);
    			attr_dev(div3, "class", "form-control mt-6");
    			add_location(div3, file$m, 64, 16, 2413);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$m, 40, 12, 1255);
    			attr_dev(div5, "class", "card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100");
    			add_location(div5, file$m, 39, 8, 1170);
    			attr_dev(div6, "class", "hero-content flex-col lg:flex-row-reverse");
    			add_location(div6, file$m, 34, 4, 866);
    			attr_dev(div7, "class", "hero min-h-screen bg-base-200");
    			add_location(div7, file$m, 33, 0, 817);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, label0);
    			append_dev(label0, span0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			set_input_value(input0, /*$generalGameData*/ ctx[0]['scoutName']);
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div2, label1);
    			append_dev(label1, span1);
    			append_dev(div2, t8);
    			append_dev(div2, input1);
    			set_input_value(input1, /*$generalGameData*/ ctx[0]['teamNum']);
    			append_dev(div4, t9);
    			append_dev(div4, label2);
    			append_dev(label2, span2);
    			append_dev(div4, t11);
    			if_block.m(div4, null);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*goToAuto*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$generalGameData*/ 1 && input0.value !== /*$generalGameData*/ ctx[0]['scoutName']) {
    				set_input_value(input0, /*$generalGameData*/ ctx[0]['scoutName']);
    			}

    			if (dirty & /*$generalGameData*/ 1 && input1.value !== /*$generalGameData*/ ctx[0]['teamNum']) {
    				set_input_value(input1, /*$generalGameData*/ ctx[0]['teamNum']);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div4, t12);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let $gameStage;
    	let $generalGameData;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(6, $gameStage = $$value));
    	validate_store(generalGameData, 'generalGameData');
    	component_subscribe($$self, generalGameData, $$value => $$invalidate(0, $generalGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let allianceColor = "blue";
    	let timer;

    	function changeColor() {
    		if ($generalGameData["allianceColor"] === "red") {
    			set_store_value(generalGameData, $generalGameData["allianceColor"] = "blue", $generalGameData);
    		} else {
    			set_store_value(generalGameData, $generalGameData["allianceColor"] = "red", $generalGameData);
    		}
    	}

    	const changeColorDebounce = e => {
    		clearTimeout(timer);

    		timer = setTimeout(
    			() => {
    				if ($generalGameData["allianceColor"] === "red") {
    					set_store_value(generalGameData, $generalGameData["allianceColor"] = "blue", $generalGameData);
    				} else {
    					set_store_value(generalGameData, $generalGameData["allianceColor"] = "red", $generalGameData);
    				}
    			},
    			20
    		);
    	};

    	function goToAuto() {
    		set_store_value(gameStage, $gameStage = 1, $gameStage);
    		console.log($gameStage);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$5.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$generalGameData['scoutName'] = this.value;
    		generalGameData.set($generalGameData);
    	}

    	function input1_input_handler() {
    		$generalGameData['teamNum'] = this.value;
    		generalGameData.set($generalGameData);
    	}

    	$$self.$capture_state = () => ({
    		gameStage,
    		generalGameData,
    		allianceColor,
    		timer,
    		changeColor,
    		changeColorDebounce,
    		goToAuto,
    		$gameStage,
    		$generalGameData
    	});

    	$$self.$inject_state = $$props => {
    		if ('allianceColor' in $$props) allianceColor = $$props.allianceColor;
    		if ('timer' in $$props) timer = $$props.timer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$generalGameData,
    		changeColorDebounce,
    		goToAuto,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\ScoringLocation.svelte generated by Svelte v3.55.1 */

    const { console: console_1$4 } = globals;

    const file$l = "src\\ScoringLocation.svelte";

    // (59:8) {:else}
    function create_else_block$4(ctx) {
    	let svg;
    	let g0;
    	let g1;
    	let g2;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			path = svg_element("path");
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$l, 66, 13, 2519);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$l, 66, 58, 2564);
    			attr_dev(path, "d", "M13.41,12l6.3-6.29a1,1,0,1,0-1.42-1.42L12,10.59,5.71,4.29A1,1,0,0,0,4.29,5.71L10.59,12l-6.3,6.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L12,13.41l6.29,6.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z");
    			add_location(path, file$l, 71, 13, 2761);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$l, 70, 14, 2719);
    			attr_dev(svg, "fill", "#e31c1c");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "id", "cross");
    			attr_dev(svg, "class", "icon glyph");
    			attr_dev(svg, "stroke", "#e31c1c");
    			add_location(svg, file$l, 59, 12, 2257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(59:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:8) {#if type === "Success"}
    function create_if_block$6(ctx) {
    	let svg;
    	let g0;
    	let g1;
    	let g2;
    	let polygon;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			polygon = svg_element("polygon");
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$l, 47, 13, 1773);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$l, 47, 58, 1818);
    			attr_dev(polygon, "fill-rule", "evenodd");
    			attr_dev(polygon, "points", "9.707 14.293 19 5 20.414 6.414 9.707 17.121 4 11.414 5.414 10");
    			add_location(polygon, file$l, 52, 16, 2019);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$l, 51, 14, 1973);
    			attr_dev(svg, "fill", "#1bbb43");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "stroke", "#1bbb43");
    			add_location(svg, file$l, 42, 12, 1583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, polygon);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(42:8) {#if type === \\\"Success\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let div;
    	let span0;

    	let t0_value = (/*$gameStage*/ ctx[2] === 1
    	? /*$autoGameData*/ ctx[3][/*cubeString*/ ctx[4]]
    	: /*$teleGameData*/ ctx[1][/*cubeString*/ ctx[4]]) + "";

    	let t0;
    	let t1;
    	let span1;

    	let t2_value = (/*$gameStage*/ ctx[2] === 1
    	? /*$autoGameData*/ ctx[3][/*coneString*/ ctx[5]]
    	: /*$teleGameData*/ ctx[1][/*coneString*/ ctx[5]]) + "";

    	let t2;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] === "Success") return create_if_block$6;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			if_block.c();
    			attr_dev(span0, "class", "indicator-item badge badge-warning text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span0, file$l, 31, 4, 1016);
    			attr_dev(span1, "class", "indicator-item indicator-start badge badge-secondary text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span1, file$l, 34, 4, 1201);
    			attr_dev(button, "class", "btn btn-square btn-outline rounded-md w-24 h-24 xl:w-36 xl:h-36");
    			add_location(button, file$l, 37, 4, 1404);
    			attr_dev(div, "class", "indicator");
    			add_location(div, file$l, 30, 0, 987);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, button);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*pressed*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameStage, $autoGameData, $teleGameData*/ 14 && t0_value !== (t0_value = (/*$gameStage*/ ctx[2] === 1
    			? /*$autoGameData*/ ctx[3][/*cubeString*/ ctx[4]]
    			: /*$teleGameData*/ ctx[1][/*cubeString*/ ctx[4]]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$gameStage, $autoGameData, $teleGameData*/ 14 && t2_value !== (t2_value = (/*$gameStage*/ ctx[2] === 1
    			? /*$autoGameData*/ ctx[3][/*coneString*/ ctx[5]]
    			: /*$teleGameData*/ ctx[1][/*coneString*/ ctx[5]]) + "")) set_data_dev(t2, t2_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let $autoStack;
    	let $teleGameData;
    	let $teleStack;
    	let $gameStage;
    	let $autoGameData;
    	let $liveGamepiece;
    	validate_store(autoStack, 'autoStack');
    	component_subscribe($$self, autoStack, $$value => $$invalidate(9, $autoStack = $$value));
    	validate_store(teleGameData, 'teleGameData');
    	component_subscribe($$self, teleGameData, $$value => $$invalidate(1, $teleGameData = $$value));
    	validate_store(teleStack, 'teleStack');
    	component_subscribe($$self, teleStack, $$value => $$invalidate(10, $teleStack = $$value));
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(2, $gameStage = $$value));
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(3, $autoGameData = $$value));
    	validate_store(liveGamepiece, 'liveGamepiece');
    	component_subscribe($$self, liveGamepiece, $$value => $$invalidate(11, $liveGamepiece = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScoringLocation', slots, []);
    	let { type = "Success" } = $$props;
    	let { height = 0 } = $$props;
    	let heightConvert = ["hybrid", "mid", "high"];
    	let dicString = heightConvert[height] + $liveGamepiece + type;
    	let cubeString = heightConvert[height] + "Cube" + type;
    	let coneString = heightConvert[height] + "Cone" + type;

    	function pressed() {
    		dicString = heightConvert[height] + $liveGamepiece + type;

    		if ($gameStage === 1) {
    			set_store_value(autoGameData, $autoGameData[dicString] += 1, $autoGameData);
    		} else if ($gameStage === 2) {
    			set_store_value(teleGameData, $teleGameData[dicString] += 1, $teleGameData);
    		}

    		if ($gameStage === 1) {
    			$autoStack.push(JSON.parse(JSON.stringify($autoGameData)));
    		}

    		if ($gameStage === 2) {
    			$teleStack.push(JSON.parse(JSON.stringify($teleGameData)));
    		}

    		console.log($autoStack);
    	}

    	const writable_props = ['type', 'height'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<ScoringLocation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('height' in $$props) $$invalidate(7, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({
    		autoGameData,
    		autoStack,
    		gameStage,
    		liveGamepiece,
    		teleGameData,
    		teleStack,
    		type,
    		height,
    		heightConvert,
    		dicString,
    		cubeString,
    		coneString,
    		pressed,
    		$autoStack,
    		$teleGameData,
    		$teleStack,
    		$gameStage,
    		$autoGameData,
    		$liveGamepiece
    	});

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('height' in $$props) $$invalidate(7, height = $$props.height);
    		if ('heightConvert' in $$props) heightConvert = $$props.heightConvert;
    		if ('dicString' in $$props) dicString = $$props.dicString;
    		if ('cubeString' in $$props) $$invalidate(4, cubeString = $$props.cubeString);
    		if ('coneString' in $$props) $$invalidate(5, coneString = $$props.coneString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		$teleGameData,
    		$gameStage,
    		$autoGameData,
    		cubeString,
    		coneString,
    		pressed,
    		height
    	];
    }

    class ScoringLocation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { type: 0, height: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScoringLocation",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get type() {
    		throw new Error("<ScoringLocation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<ScoringLocation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<ScoringLocation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<ScoringLocation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\TrashCan.svelte generated by Svelte v3.55.1 */
    const file$k = "src\\TrashCan.svelte";

    function create_fragment$l(ctx) {
    	let div;
    	let span0;

    	let t0_value = (/*$gameStage*/ ctx[1] === 1
    	? /*$autoGameData*/ ctx[2]["droppedCube"]
    	: /*$teleGameData*/ ctx[0]["droppedCube"]) + "";

    	let t0;
    	let t1;
    	let span1;

    	let t2_value = (/*$gameStage*/ ctx[1] === 1
    	? /*$autoGameData*/ ctx[2]["droppedCone"]
    	: /*$teleGameData*/ ctx[0]["droppedCone"]) + "";

    	let t2;
    	let t3;
    	let button;
    	let svg;
    	let g0;
    	let g1;
    	let g2;
    	let path0;
    	let path1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(span0, "class", "indicator-item badge badge-warning text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span0, file$k, 27, 4, 818);
    			attr_dev(span1, "class", "indicator-item indicator-start badge badge-secondary text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span1, file$k, 30, 4, 1009);
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$k, 45, 12, 1703);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			attr_dev(g1, "stroke", "#ffffff");
    			attr_dev(g1, "stroke-width", "16.384");
    			add_location(g1, file$k, 47, 12, 1764);
    			attr_dev(path0, "d", "M692.2 182.2V72.9H327.8v109.3H145.6v72.9h728.8v-72.9H692.2z m-291.5 0v-36.4h218.6v36.4H400.7zM730.8 874.5H289.2l-34.3-548.8-72.8 4.5 38.6 617.2h578.6l38.6-617.2-72.8-4.5z");
    			attr_dev(path0, "fill", "#ffffff");
    			add_location(path0, file$k, 56, 16, 2062);
    			attr_dev(path1, "d", "M400.7 400.8h72.9v437.3h-72.9zM546.4 400.8h72.9v437.3h-72.9z");
    			attr_dev(path1, "fill", "#ffffff");
    			add_location(path1, file$k, 61, 16, 2347);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$k, 55, 12, 2016);
    			attr_dev(svg, "viewBox", "0 0 1024.00 1024.00");
    			attr_dev(svg, "class", "icon w-16 h-16 xl:w-24 xl:h-24");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "#ffffff");
    			attr_dev(svg, "stroke", "#ffffff");
    			attr_dev(svg, "stroke-width", "12.288");
    			attr_dev(svg, "transform", "rotate(0)");
    			add_location(svg, file$k, 34, 8, 1342);
    			attr_dev(button, "class", "btn btn-square btn-outline w-24 h-24 btn-error xl:w-36 xl:h-36");
    			button.disabled = false;
    			add_location(button, file$k, 33, 4, 1218);
    			attr_dev(div, "class", "indicator");
    			add_location(div, file$k, 26, 0, 789);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, path0);
    			append_dev(g2, path1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*update*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameStage, $autoGameData, $teleGameData*/ 7 && t0_value !== (t0_value = (/*$gameStage*/ ctx[1] === 1
    			? /*$autoGameData*/ ctx[2]["droppedCube"]
    			: /*$teleGameData*/ ctx[0]["droppedCube"]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$gameStage, $autoGameData, $teleGameData*/ 7 && t2_value !== (t2_value = (/*$gameStage*/ ctx[1] === 1
    			? /*$autoGameData*/ ctx[2]["droppedCone"]
    			: /*$teleGameData*/ ctx[0]["droppedCone"]) + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $teleGameData;
    	let $liveGamepiece;
    	let $gameStage;
    	let $autoGameData;
    	validate_store(teleGameData, 'teleGameData');
    	component_subscribe($$self, teleGameData, $$value => $$invalidate(0, $teleGameData = $$value));
    	validate_store(liveGamepiece, 'liveGamepiece');
    	component_subscribe($$self, liveGamepiece, $$value => $$invalidate(5, $liveGamepiece = $$value));
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(1, $gameStage = $$value));
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(2, $autoGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TrashCan', slots, []);
    	let { gameMode = "Auto" } = $$props;
    	let displayConeValue = 0;
    	let displayCubeValue = 0;
    	let dataField = " ";

    	function update() {
    		if ($gameStage === 1) {
    			if ($liveGamepiece === "Cone") {
    				set_store_value(autoGameData, $autoGameData["droppedCone"]++, $autoGameData);
    			} else if ($liveGamepiece === "Cube") {
    				set_store_value(autoGameData, $autoGameData["droppedCube"]++, $autoGameData);
    			}
    		} else if ($gameStage === 2) {
    			if ($liveGamepiece === "Cone") {
    				set_store_value(teleGameData, $teleGameData["droppedCone"]++, $teleGameData);
    			} else if ($liveGamepiece === "Cube") {
    				set_store_value(teleGameData, $teleGameData["droppedCube"]++, $teleGameData);
    			}
    		}
    	}

    	const writable_props = ['gameMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TrashCan> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('gameMode' in $$props) $$invalidate(4, gameMode = $$props.gameMode);
    	};

    	$$self.$capture_state = () => ({
    		autoGameData,
    		gameStage,
    		liveGamepiece,
    		teleGameData,
    		gameMode,
    		displayConeValue,
    		displayCubeValue,
    		dataField,
    		update,
    		$teleGameData,
    		$liveGamepiece,
    		$gameStage,
    		$autoGameData
    	});

    	$$self.$inject_state = $$props => {
    		if ('gameMode' in $$props) $$invalidate(4, gameMode = $$props.gameMode);
    		if ('displayConeValue' in $$props) displayConeValue = $$props.displayConeValue;
    		if ('displayCubeValue' in $$props) displayCubeValue = $$props.displayCubeValue;
    		if ('dataField' in $$props) dataField = $$props.dataField;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$teleGameData, $gameStage, $autoGameData, update, gameMode];
    }

    class TrashCan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { gameMode: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TrashCan",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get gameMode() {
    		throw new Error("<TrashCan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameMode(value) {
    		throw new Error("<TrashCan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\NextStageButton.svelte generated by Svelte v3.55.1 */
    const file$j = "src\\NextStageButton.svelte";

    function create_fragment$k(ctx) {
    	let div;
    	let svg;
    	let path;
    	let t;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t = space();
    			button = element("button");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M8.25 4.5l7.5 7.5-7.5 7.5");
    			add_location(path, file$j, 12, 8, 378);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48");
    			add_location(svg, file$j, 11, 4, 180);
    			attr_dev(button, "class", "btn btn-outline w-12 h-28 z-50 xl:h-64 xl:w-24");
    			add_location(button, file$j, 15, 0, 479);
    			attr_dev(div, "class", "flex items-center justify-center ");
    			add_location(div, file$j, 9, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    			append_dev(div, t);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*nextStage*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $gameStage;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(1, $gameStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NextStageButton', slots, []);

    	function nextStage() {
    		set_store_value(gameStage, $gameStage++, $gameStage);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NextStageButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameStage, nextStage, $gameStage });
    	return [nextStage];
    }

    class NextStageButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NextStageButton",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\ScoringLocationCombo.svelte generated by Svelte v3.55.1 */
    const file$i = "src\\ScoringLocationCombo.svelte";

    function create_fragment$j(ctx) {
    	let div15;
    	let div3;
    	let div0;
    	let scoringlocation0;
    	let t0;
    	let div1;
    	let scoringlocation1;
    	let t1;
    	let div2;
    	let t3;
    	let div7;
    	let div4;
    	let scoringlocation2;
    	let t4;
    	let div5;
    	let scoringlocation3;
    	let t5;
    	let div6;
    	let t7;
    	let div11;
    	let div8;
    	let scoringlocation4;
    	let t8;
    	let div9;
    	let scoringlocation5;
    	let t9;
    	let div10;
    	let t11;
    	let div14;
    	let div12;
    	let trashcan;
    	let t12;
    	let div13;
    	let current;
    	scoringlocation0 = new ScoringLocation({ props: { height: "2" }, $$inline: true });

    	scoringlocation1 = new ScoringLocation({
    			props: { type: "Fail", height: "2" },
    			$$inline: true
    		});

    	scoringlocation2 = new ScoringLocation({ props: { height: "1" }, $$inline: true });

    	scoringlocation3 = new ScoringLocation({
    			props: { type: "Fail", height: "1" },
    			$$inline: true
    		});

    	scoringlocation4 = new ScoringLocation({ props: { height: "0" }, $$inline: true });

    	scoringlocation5 = new ScoringLocation({
    			props: { type: "Fail", height: "0" },
    			$$inline: true
    		});

    	trashcan = new TrashCan({ $$inline: true });

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(scoringlocation0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(scoringlocation1.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div2.textContent = "High";
    			t3 = space();
    			div7 = element("div");
    			div4 = element("div");
    			create_component(scoringlocation2.$$.fragment);
    			t4 = space();
    			div5 = element("div");
    			create_component(scoringlocation3.$$.fragment);
    			t5 = space();
    			div6 = element("div");
    			div6.textContent = "Mid";
    			t7 = space();
    			div11 = element("div");
    			div8 = element("div");
    			create_component(scoringlocation4.$$.fragment);
    			t8 = space();
    			div9 = element("div");
    			create_component(scoringlocation5.$$.fragment);
    			t9 = space();
    			div10 = element("div");
    			div10.textContent = "Hybrid";
    			t11 = space();
    			div14 = element("div");
    			div12 = element("div");
    			create_component(trashcan.$$.fragment);
    			t12 = space();
    			div13 = element("div");
    			div13.textContent = "Dropped";
    			attr_dev(div0, "class", "p-2 mr-2");
    			add_location(div0, file$i, 11, 8, 327);
    			attr_dev(div1, "class", "p-5 mr-2 xl:p-10");
    			add_location(div1, file$i, 14, 8, 416);
    			attr_dev(div2, "class", "text-center -ml-3 text-xl font-bold xl:text-3xl");
    			add_location(div2, file$i, 17, 8, 528);
    			attr_dev(div3, "class", "flex items-center mb-2 xl:mb-4");
    			add_location(div3, file$i, 10, 4, 273);
    			attr_dev(div4, "class", "p-2 mr-2");
    			add_location(div4, file$i, 20, 8, 663);
    			attr_dev(div5, "class", "p-5 mr-2 xl:p-10");
    			add_location(div5, file$i, 23, 8, 755);
    			attr_dev(div6, "class", "text-center -ml-3 text-xl font-bold xl:text-3xl");
    			add_location(div6, file$i, 26, 8, 867);
    			attr_dev(div7, "class", "flex items-center mb-2");
    			add_location(div7, file$i, 19, 4, 617);
    			attr_dev(div8, "class", "p-2 mr-2");
    			add_location(div8, file$i, 29, 8, 996);
    			attr_dev(div9, "class", "p-5 mr-2 xl:p-10");
    			add_location(div9, file$i, 32, 8, 1088);
    			attr_dev(div10, "class", "text-center -ml-3 text-xl font-bold xl:text-3xl");
    			add_location(div10, file$i, 35, 8, 1200);
    			attr_dev(div11, "class", "flex items-center");
    			add_location(div11, file$i, 28, 4, 955);
    			attr_dev(div12, "class", "p-2 mr-2");
    			add_location(div12, file$i, 38, 8, 1332);
    			attr_dev(div13, "class", "text-center text-xl font-bold xl:text-3xl xl:ml-4");
    			add_location(div13, file$i, 42, 8, 1408);
    			attr_dev(div14, "class", "flex items-center");
    			add_location(div14, file$i, 37, 4, 1291);
    			attr_dev(div15, "class", "flex flex-col");
    			add_location(div15, file$i, 9, 0, 240);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div3);
    			append_dev(div3, div0);
    			mount_component(scoringlocation0, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(scoringlocation1, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div15, t3);
    			append_dev(div15, div7);
    			append_dev(div7, div4);
    			mount_component(scoringlocation2, div4, null);
    			append_dev(div7, t4);
    			append_dev(div7, div5);
    			mount_component(scoringlocation3, div5, null);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div15, t7);
    			append_dev(div15, div11);
    			append_dev(div11, div8);
    			mount_component(scoringlocation4, div8, null);
    			append_dev(div11, t8);
    			append_dev(div11, div9);
    			mount_component(scoringlocation5, div9, null);
    			append_dev(div11, t9);
    			append_dev(div11, div10);
    			append_dev(div15, t11);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			mount_component(trashcan, div12, null);
    			append_dev(div14, t12);
    			append_dev(div14, div13);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scoringlocation0.$$.fragment, local);
    			transition_in(scoringlocation1.$$.fragment, local);
    			transition_in(scoringlocation2.$$.fragment, local);
    			transition_in(scoringlocation3.$$.fragment, local);
    			transition_in(scoringlocation4.$$.fragment, local);
    			transition_in(scoringlocation5.$$.fragment, local);
    			transition_in(trashcan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scoringlocation0.$$.fragment, local);
    			transition_out(scoringlocation1.$$.fragment, local);
    			transition_out(scoringlocation2.$$.fragment, local);
    			transition_out(scoringlocation3.$$.fragment, local);
    			transition_out(scoringlocation4.$$.fragment, local);
    			transition_out(scoringlocation5.$$.fragment, local);
    			transition_out(trashcan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			destroy_component(scoringlocation0);
    			destroy_component(scoringlocation1);
    			destroy_component(scoringlocation2);
    			destroy_component(scoringlocation3);
    			destroy_component(scoringlocation4);
    			destroy_component(scoringlocation5);
    			destroy_component(trashcan);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScoringLocationCombo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScoringLocationCombo> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ScoringLocation,
    		TrashCan,
    		NextStageButton,
    		autoGameData
    	});

    	return [];
    }

    class ScoringLocationCombo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScoringLocationCombo",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\GamePiece.svelte generated by Svelte v3.55.1 */

    const { console: console_1$3 } = globals;
    const file$h = "src\\GamePiece.svelte";

    // (36:4) {:else}
    function create_else_block$3(ctx) {
    	let svg;
    	let g0;
    	let g1;
    	let g2;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			path = svg_element("path");
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$h, 40, 9, 1914);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$h, 40, 54, 1959);
    			attr_dev(path, "d", "M7.03 1.88c.252-1.01 1.688-1.01 1.94 0l2.905 11.62H14a.5.5 0 0 1 0 1H2a.5.5 0 0 1 0-1h2.125L7.03 1.88z");
    			add_location(path, file$h, 45, 12, 2140);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$h, 44, 10, 2098);
    			attr_dev(svg, "class", "bi bi-cone w-20 h-20 xl:w-48 xl:h-48 fill-secondary stroke-secondary");
    			attr_dev(svg, "viewBox", "0 0 16.00 16.00");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$h, 36, 8, 1709);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(36:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {#if gamePiece === "Cube"}
    function create_if_block$5(ctx) {
    	let svg;
    	let g0;
    	let g1;
    	let g2;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			path = svg_element("path");
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$h, 25, 9, 688);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$h, 25, 54, 733);
    			attr_dev(path, "d", "M 28.0000 26.6406 L 50.0783 14.1016 C 49.7264 13.75 49.3045 13.4688 48.7890 13.1875 L 32.2657 3.7657 C 30.8126 2.9453 29.4063 2.5000 28.0000 2.5000 C 26.5938 2.5000 25.1875 2.9453 23.7344 3.7657 L 7.2110 13.1875 C 6.6954 13.4688 6.2735 13.75 5.9219 14.1016 Z M 26.4063 53.5 L 26.4063 29.4532 L 4.3985 16.8906 C 4.2813 17.4063 4.2110 17.9688 4.2110 18.6719 L 4.2110 36.9297 C 4.2110 40.3281 5.4063 41.5938 7.5860 42.8360 L 25.9375 53.2891 C 26.1016 53.3828 26.2422 53.4532 26.4063 53.5 Z M 29.5938 53.5 C 29.7579 53.4532 29.8985 53.3828 30.0626 53.2891 L 48.4141 42.8360 C 50.5938 41.5938 51.7890 40.3281 51.7890 36.9297 L 51.7890 18.6719 C 51.7890 17.9688 51.7189 17.4063 51.6018 16.8906 L 29.5938 29.4532 Z");
    			add_location(path, file$h, 30, 9, 910);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$h, 29, 10, 872);
    			attr_dev(svg, "class", "w-20 h-20 xl:w-48 xl:h-48 fill-warning stroke-warning");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$h, 21, 8, 505);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(21:4) {#if gamePiece === \\\"Cube\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*gamePiece*/ ctx[0] === "Cube") return create_if_block$5;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();

    			attr_dev(button, "class", button_class_value = "btn btn-square back bg-base-100 btn-outline w-28 h-28 xl:w-64 xl:h-64 " + (/*gamePiece*/ ctx[0] === 'Cube'
    			? 'btn-warning'
    			: 'btn-secondary') + "");

    			add_location(button, file$h, 14, 0, 252);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*updateGameObject*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (dirty & /*gamePiece*/ 1 && button_class_value !== (button_class_value = "btn btn-square back bg-base-100 btn-outline w-28 h-28 xl:w-64 xl:h-64 " + (/*gamePiece*/ ctx[0] === 'Cube'
    			? 'btn-warning'
    			: 'btn-secondary') + "")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $liveGamepiece;
    	validate_store(liveGamepiece, 'liveGamepiece');
    	component_subscribe($$self, liveGamepiece, $$value => $$invalidate(2, $liveGamepiece = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GamePiece', slots, []);
    	let { gamePiece = "Cube" } = $$props;
    	let coneSVG = "";

    	function updateGameObject() {
    		set_store_value(liveGamepiece, $liveGamepiece = gamePiece, $liveGamepiece);
    		console.log($liveGamepiece);
    	}

    	const writable_props = ['gamePiece'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<GamePiece> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('gamePiece' in $$props) $$invalidate(0, gamePiece = $$props.gamePiece);
    	};

    	$$self.$capture_state = () => ({
    		liveGamepiece,
    		gamePiece,
    		coneSVG,
    		updateGameObject,
    		$liveGamepiece
    	});

    	$$self.$inject_state = $$props => {
    		if ('gamePiece' in $$props) $$invalidate(0, gamePiece = $$props.gamePiece);
    		if ('coneSVG' in $$props) coneSVG = $$props.coneSVG;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [gamePiece, updateGameObject];
    }

    class GamePiece extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { gamePiece: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GamePiece",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get gamePiece() {
    		throw new Error("<GamePiece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gamePiece(value) {
    		throw new Error("<GamePiece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LastStageButton.svelte generated by Svelte v3.55.1 */
    const file$g = "src\\LastStageButton.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M15.75 19.5L8.25 12l7.5-7.5");
    			add_location(path, file$g, 13, 12, 488);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48");
    			add_location(svg, file$g, 12, 8, 286);
    			attr_dev(button, "class", "btn btn-outline w-12 h-28 z-50 xl:h-64 xl:w-24 bg-base-100");
    			add_location(button, file$g, 11, 4, 180);
    			attr_dev(div, "class", "flex items-center justify-center ");
    			add_location(div, file$g, 8, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*nextStage*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $gameStage;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(1, $gameStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LastStageButton', slots, []);

    	function nextStage() {
    		set_store_value(gameStage, $gameStage--, $gameStage);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LastStageButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameStage, nextStage, $gameStage });
    	return [nextStage];
    }

    class LastStageButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LastStageButton",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\QRButton.svelte generated by Svelte v3.55.1 */
    const file$f = "src\\QRButton.svelte";

    function create_fragment$g(ctx) {
    	let button;
    	let svg;
    	let path0;
    	let path1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z");
    			add_location(path0, file$f, 10, 8, 354);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z");
    			add_location(path1, file$f, 11, 8, 862);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-20 h-20");
    			add_location(svg, file$f, 9, 4, 213);
    			attr_dev(button, "class", "btn btn-outline btn-primary w-48 h-28 bg-base-100");
    			add_location(button, file$f, 8, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*pressed*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $gameStage;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(1, $gameStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QRButton', slots, []);

    	function pressed() {
    		set_store_value(gameStage, $gameStage++, $gameStage);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QRButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameStage, pressed, $gameStage });
    	return [pressed];
    }

    class QRButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QRButton",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\RestartButton.svelte generated by Svelte v3.55.1 */
    const file$e = "src\\RestartButton.svelte";

    function create_fragment$f(ctx) {
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99");
    			add_location(path, file$e, 10, 8, 354);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-16 h-16");
    			add_location(svg, file$e, 9, 4, 215);
    			attr_dev(button, "class", "btn btn-outline btn-primary w-48 h-28 bg-base-100");
    			add_location(button, file$e, 8, 0, 124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*pressed*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $gameStage;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(1, $gameStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RestartButton', slots, []);

    	function pressed() {
    		set_store_value(gameStage, $gameStage = 0, $gameStage);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RestartButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ gameStage, pressed, $gameStage });
    	return [pressed];
    }

    class RestartButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RestartButton",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\GamePieceCombo.svelte generated by Svelte v3.55.1 */
    const file$d = "src\\GamePieceCombo.svelte";

    // (27:24) 
    function create_if_block_2$1(ctx) {
    	let laststagebutton;
    	let t;
    	let div;
    	let restartbutton;
    	let current;
    	laststagebutton = new LastStageButton({ $$inline: true });
    	restartbutton = new RestartButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(laststagebutton.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(restartbutton.$$.fragment);
    			attr_dev(div, "class", "ml-3");
    			add_location(div, file$d, 28, 4, 742);
    		},
    		m: function mount(target, anchor) {
    			mount_component(laststagebutton, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(restartbutton, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(laststagebutton.$$.fragment, local);
    			transition_in(restartbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(laststagebutton.$$.fragment, local);
    			transition_out(restartbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(laststagebutton, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(restartbutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(27:24) ",
    		ctx
    	});

    	return block;
    }

    // (22:26) 
    function create_if_block_1$1(ctx) {
    	let laststagebutton;
    	let t;
    	let div;
    	let qrbutton;
    	let current;
    	laststagebutton = new LastStageButton({ $$inline: true });
    	qrbutton = new QRButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(laststagebutton.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(qrbutton.$$.fragment);
    			attr_dev(div, "class", "ml-3");
    			add_location(div, file$d, 23, 4, 635);
    		},
    		m: function mount(target, anchor) {
    			mount_component(laststagebutton, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(qrbutton, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(laststagebutton.$$.fragment, local);
    			transition_in(qrbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(laststagebutton.$$.fragment, local);
    			transition_out(qrbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(laststagebutton, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(qrbutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(22:26) ",
    		ctx
    	});

    	return block;
    }

    // (11:0) {#if type === "normal"}
    function create_if_block$4(ctx) {
    	let laststagebutton;
    	let t0;
    	let div0;
    	let gamepiece0;
    	let t1;
    	let div1;
    	let gamepiece1;
    	let t2;
    	let div2;
    	let nextstagebutton;
    	let current;
    	laststagebutton = new LastStageButton({ $$inline: true });

    	gamepiece0 = new GamePiece({
    			props: { gamePiece: "Cone" },
    			$$inline: true
    		});

    	gamepiece1 = new GamePiece({ $$inline: true });
    	nextstagebutton = new NextStageButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(laststagebutton.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(gamepiece0.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(gamepiece1.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(nextstagebutton.$$.fragment);
    			attr_dev(div0, "class", "ml-3");
    			add_location(div0, file$d, 12, 4, 386);
    			attr_dev(div1, "class", "ml-3");
    			add_location(div1, file$d, 15, 4, 461);
    			attr_dev(div2, "class", "ml-3");
    			add_location(div2, file$d, 18, 4, 519);
    		},
    		m: function mount(target, anchor) {
    			mount_component(laststagebutton, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(gamepiece0, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(gamepiece1, div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(nextstagebutton, div2, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(laststagebutton.$$.fragment, local);
    			transition_in(gamepiece0.$$.fragment, local);
    			transition_in(gamepiece1.$$.fragment, local);
    			transition_in(nextstagebutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(laststagebutton.$$.fragment, local);
    			transition_out(gamepiece0.$$.fragment, local);
    			transition_out(gamepiece1.$$.fragment, local);
    			transition_out(nextstagebutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(laststagebutton, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_component(gamepiece0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(gamepiece1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			destroy_component(nextstagebutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(11:0) {#if type === \\\"normal\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$1, create_if_block_2$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] === "normal") return 0;
    		if (/*type*/ ctx[0] === "post") return 1;
    		if (/*type*/ ctx[0] === "qr") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GamePieceCombo', slots, []);
    	let { type = "normal" } = $$props;
    	const writable_props = ['type'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GamePieceCombo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({
    		GamePiece,
    		NextStageButton,
    		LastStageButton,
    		QRButton,
    		RestartButton,
    		type
    	});

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type];
    }

    class GamePieceCombo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GamePieceCombo",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get type() {
    		throw new Error("<GamePieceCombo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<GamePieceCombo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\StartLocationDropdown.svelte generated by Svelte v3.55.1 */

    const { console: console_1$2 } = globals;
    const file$c = "src\\StartLocationDropdown.svelte";

    function create_fragment$d(ctx) {
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Select Starting Location";
    			option1 = element("option");
    			option1.textContent = "Long Side";
    			option2 = element("option");
    			option2.textContent = "Center";
    			option3 = element("option");
    			option3.textContent = "Short Side";
    			option0.disabled = true;
    			option0.selected = true;
    			option0.__value = "Select Starting Location";
    			option0.value = option0.__value;
    			add_location(option0, file$c, 16, 4, 581);
    			option1.__value = "Long Side";
    			option1.value = option1.__value;
    			add_location(option1, file$c, 17, 4, 646);
    			option2.__value = "Center";
    			option2.value = option2.__value;
    			add_location(option2, file$c, 18, 4, 678);
    			option3.__value = "Short Side";
    			option3.value = option3.__value;
    			add_location(option3, file$c, 19, 4, 707);
    			attr_dev(select, "class", "select select-primary w-64 xl:w-80 text-base xl:text-lg");
    			if (/*input*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[3].call(select));
    			add_location(select, file$c, 15, 0, 460);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			select_option(select, /*input*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[3]),
    					listen_dev(select, "change", /*changeInput*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*input*/ 1) {
    				select_option(select, /*input*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $autoGameData;
    	let $autoStack;
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(2, $autoGameData = $$value));
    	validate_store(autoStack, 'autoStack');
    	component_subscribe($$self, autoStack, $$value => $$invalidate(4, $autoStack = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartLocationDropdown', slots, []);
    	let input = "Select Starting Location";

    	function changeInput() {
    		set_store_value(autoGameData, $autoGameData["startingLocation"] = input, $autoGameData);
    		console.log($autoGameData["startingLocation"]);
    		$autoStack.push(JSON.parse(JSON.stringify($autoGameData)));
    		console.log($autoStack);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<StartLocationDropdown> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		input = select_value(this);
    		($$invalidate(0, input), $$invalidate(2, $autoGameData));
    	}

    	$$self.$capture_state = () => ({
    		autoGameData,
    		autoStack,
    		input,
    		changeInput,
    		$autoGameData,
    		$autoStack
    	});

    	$$self.$inject_state = $$props => {
    		if ('input' in $$props) $$invalidate(0, input = $$props.input);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$autoGameData*/ 4) {
    			($autoGameData["startingLocation"], $$invalidate(0, input = $autoGameData["startingLocation"]));
    		}
    	};

    	return [input, changeInput, $autoGameData, select_change_handler];
    }

    class StartLocationDropdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartLocationDropdown",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\MobilityBox.svelte generated by Svelte v3.55.1 */
    const file$b = "src\\MobilityBox.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let label;
    	let span;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span = element("span");
    			span.textContent = "Mobility";
    			t1 = space();
    			input = element("input");
    			attr_dev(span, "class", "label-text text-sm xl:text-lg");
    			add_location(span, file$b, 7, 8, 177);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$b, 8, 8, 246);
    			attr_dev(label, "class", "cursor-pointer label w-12 flex flex-col content-center");
    			add_location(label, file$b, 6, 4, 97);
    			attr_dev(div, "class", "form-control");
    			add_location(div, file$b, 5, 0, 65);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, span);
    			append_dev(label, t1);
    			append_dev(label, input);
    			input.checked = /*$autoGameData*/ ctx[0]["mobility"];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$autoGameData*/ 1) {
    				input.checked = /*$autoGameData*/ ctx[0]["mobility"];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $autoGameData;
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(0, $autoGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MobilityBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MobilityBox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		$autoGameData["mobility"] = this.checked;
    		autoGameData.set($autoGameData);
    	}

    	$$self.$capture_state = () => ({ autoGameData, $autoGameData });
    	return [$autoGameData, input_change_handler];
    }

    class MobilityBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobilityBox",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\DockedBox.svelte generated by Svelte v3.55.1 */
    const file$a = "src\\DockedBox.svelte";

    // (10:12) {:else}
    function create_else_block$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$a, 10, 12, 449);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*$teleGameData*/ ctx[2]["docked"];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler_1*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$teleGameData*/ 4) {
    				input.checked = /*$teleGameData*/ ctx[2]["docked"];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(10:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:8) {#if $gameStage === 1}
    function create_if_block$3(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$a, 8, 8, 305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*$autoGameData*/ ctx[1]["docked"];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$autoGameData*/ 2) {
    				input.checked = /*$autoGameData*/ ctx[1]["docked"];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(8:8) {#if $gameStage === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let label;
    	let span;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*$gameStage*/ ctx[0] === 1) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span = element("span");
    			span.textContent = "Docked";
    			t1 = space();
    			if_block.c();
    			attr_dev(span, "class", "label-text text-base xl:text-lg");
    			add_location(span, file$a, 6, 8, 204);
    			attr_dev(label, "class", "cursor-pointer label w-12 flex flex-col content-center");
    			add_location(label, file$a, 5, 4, 124);
    			attr_dev(div, "class", "form-control");
    			add_location(div, file$a, 4, 0, 92);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, span);
    			append_dev(label, t1);
    			if_block.m(label, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(label, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $gameStage;
    	let $autoGameData;
    	let $teleGameData;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(0, $gameStage = $$value));
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(1, $autoGameData = $$value));
    	validate_store(teleGameData, 'teleGameData');
    	component_subscribe($$self, teleGameData, $$value => $$invalidate(2, $teleGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DockedBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DockedBox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		$autoGameData["docked"] = this.checked;
    		autoGameData.set($autoGameData);
    	}

    	function input_change_handler_1() {
    		$teleGameData["docked"] = this.checked;
    		teleGameData.set($teleGameData);
    	}

    	$$self.$capture_state = () => ({
    		autoGameData,
    		gameStage,
    		teleGameData,
    		$gameStage,
    		$autoGameData,
    		$teleGameData
    	});

    	return [
    		$gameStage,
    		$autoGameData,
    		$teleGameData,
    		input_change_handler,
    		input_change_handler_1
    	];
    }

    class DockedBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DockedBox",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\BalancedBox.svelte generated by Svelte v3.55.1 */
    const file$9 = "src\\BalancedBox.svelte";

    // (10:8) {:else}
    function create_else_block$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$9, 10, 12, 453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*$teleGameData*/ ctx[2]["balanced"];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler_1*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$teleGameData*/ 4) {
    				input.checked = /*$teleGameData*/ ctx[2]["balanced"];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(10:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:8) {#if $gameStage === 1}
    function create_if_block$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$9, 8, 12, 311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*$autoGameData*/ ctx[1]["balanced"];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$autoGameData*/ 2) {
    				input.checked = /*$autoGameData*/ ctx[1]["balanced"];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:8) {#if $gameStage === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let label;
    	let span;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*$gameStage*/ ctx[0] === 1) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span = element("span");
    			span.textContent = "Balanced";
    			t1 = space();
    			if_block.c();
    			attr_dev(span, "class", "label-text text-base xl:text-lg");
    			add_location(span, file$9, 6, 8, 204);
    			attr_dev(label, "class", "cursor-pointer label w-12 flex flex-col content-center");
    			add_location(label, file$9, 5, 4, 124);
    			attr_dev(div, "class", "form-control");
    			add_location(div, file$9, 4, 0, 92);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, span);
    			append_dev(label, t1);
    			if_block.m(label, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(label, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $gameStage;
    	let $autoGameData;
    	let $teleGameData;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(0, $gameStage = $$value));
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(1, $autoGameData = $$value));
    	validate_store(teleGameData, 'teleGameData');
    	component_subscribe($$self, teleGameData, $$value => $$invalidate(2, $teleGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BalancedBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BalancedBox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		$autoGameData["balanced"] = this.checked;
    		autoGameData.set($autoGameData);
    	}

    	function input_change_handler_1() {
    		$teleGameData["balanced"] = this.checked;
    		teleGameData.set($teleGameData);
    	}

    	$$self.$capture_state = () => ({
    		autoGameData,
    		gameStage,
    		teleGameData,
    		$gameStage,
    		$autoGameData,
    		$teleGameData
    	});

    	return [
    		$gameStage,
    		$autoGameData,
    		$teleGameData,
    		input_change_handler,
    		input_change_handler_1
    	];
    }

    class BalancedBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BalancedBox",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\UndoButton.svelte generated by Svelte v3.55.1 */

    const { console: console_1$1 } = globals;

    const file$8 = "src\\UndoButton.svelte";

    function create_fragment$9(ctx) {
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3");
    			add_location(path, file$8, 26, 8, 871);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$8, 25, 4, 732);
    			attr_dev(button, "class", "btn btn-square btn-outline btn-md");
    			add_location(button, file$8, 24, 0, 657);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*clicked*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $teleStack;
    	let $teleGameData;
    	let $gameStage;
    	let $autoStack;
    	let $autoGameData;
    	validate_store(teleStack, 'teleStack');
    	component_subscribe($$self, teleStack, $$value => $$invalidate(1, $teleStack = $$value));
    	validate_store(teleGameData, 'teleGameData');
    	component_subscribe($$self, teleGameData, $$value => $$invalidate(2, $teleGameData = $$value));
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(3, $gameStage = $$value));
    	validate_store(autoStack, 'autoStack');
    	component_subscribe($$self, autoStack, $$value => $$invalidate(4, $autoStack = $$value));
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(5, $autoGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('UndoButton', slots, []);

    	function clicked() {
    		if ($gameStage === 1) {
    			if ($autoStack.length > 1) {
    				set_store_value(autoGameData, $autoGameData = $autoStack.pop(), $autoGameData);
    				console.log($autoGameData);
    			} else {
    				set_store_value(autoGameData, $autoGameData = JSON.parse(JSON.stringify($autoStack[0])), $autoGameData);
    				console.log($autoStack);
    			}
    		}

    		if ($gameStage === 2) {
    			if ($teleStack.length > 0) {
    				set_store_value(teleGameData, $teleGameData = $teleStack.pop(), $teleGameData);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<UndoButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		autoGameData,
    		autoStack,
    		gameStage,
    		postGameData,
    		teleGameData,
    		teleStack,
    		clicked,
    		$teleStack,
    		$teleGameData,
    		$gameStage,
    		$autoStack,
    		$autoGameData
    	});

    	return [clicked];
    }

    class UndoButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UndoButton",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Auto.svelte generated by Svelte v3.55.1 */
    const file$7 = "src\\Auto.svelte";

    function create_fragment$8(ctx) {
    	let div8;
    	let div2;
    	let undobutton;
    	let t0;
    	let div0;
    	let startlocationdropdown;
    	let t1;
    	let div1;
    	let mobilitybox;
    	let t2;
    	let div7;
    	let div3;
    	let t4;
    	let div4;
    	let dockedbox;
    	let t5;
    	let div5;
    	let balancedbox;
    	let t6;
    	let div6;
    	let t8;
    	let div9;
    	let gamepiececombo;
    	let t9;
    	let div11;
    	let div10;
    	let scoringlocationcombo;
    	let t10;
    	let br0;
    	let br1;
    	let br2;
    	let br3;
    	let hr;
    	let current;
    	undobutton = new UndoButton({ $$inline: true });
    	startlocationdropdown = new StartLocationDropdown({ $$inline: true });
    	mobilitybox = new MobilityBox({ $$inline: true });
    	dockedbox = new DockedBox({ $$inline: true });
    	balancedbox = new BalancedBox({ $$inline: true });

    	gamepiececombo = new GamePieceCombo({
    			props: { class: "mx-auto" },
    			$$inline: true
    		});

    	scoringlocationcombo = new ScoringLocationCombo({ $$inline: true });

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div2 = element("div");
    			create_component(undobutton.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(startlocationdropdown.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(mobilitybox.$$.fragment);
    			t2 = space();
    			div7 = element("div");
    			div3 = element("div");
    			div3.textContent = "Auto";
    			t4 = space();
    			div4 = element("div");
    			create_component(dockedbox.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			create_component(balancedbox.$$.fragment);
    			t6 = space();
    			div6 = element("div");
    			div6.textContent = "6328";
    			t8 = space();
    			div9 = element("div");
    			create_component(gamepiececombo.$$.fragment);
    			t9 = space();
    			div11 = element("div");
    			div10 = element("div");
    			create_component(scoringlocationcombo.$$.fragment);
    			t10 = space();
    			br0 = element("br");
    			br1 = element("br");
    			br2 = element("br");
    			br3 = element("br");
    			hr = element("hr");
    			attr_dev(div0, "class", "ml-2");
    			add_location(div0, file$7, 22, 8, 875);
    			attr_dev(div1, "class", "-mt-4 ml-2");
    			add_location(div1, file$7, 25, 8, 953);
    			attr_dev(div2, "class", "flex justify-center");
    			add_location(div2, file$7, 20, 4, 809);
    			attr_dev(div3, "class", "text-3xl mt-7 ");
    			add_location(div3, file$7, 30, 8, 1088);
    			attr_dev(div4, "class", "ml-8");
    			add_location(div4, file$7, 33, 8, 1160);
    			attr_dev(div5, "class", "ml-16");
    			add_location(div5, file$7, 36, 8, 1230);
    			attr_dev(div6, "class", "text-3xl mt-8 ml-8");
    			add_location(div6, file$7, 39, 8, 1303);
    			attr_dev(div7, "class", "flex justify-center -mt-2");
    			add_location(div7, file$7, 29, 4, 1039);
    			attr_dev(div8, "class", "z-20 pt-4 xl:pl-0xl:pl-8 z-10");
    			add_location(div8, file$7, 19, 0, 759);
    			attr_dev(div9, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div9, file$7, 47, 0, 1397);
    			attr_dev(div10, "class", "mt-6");
    			add_location(div10, file$7, 52, 4, 1579);
    			attr_dev(div11, "class", "pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10");
    			add_location(div11, file$7, 51, 0, 1508);
    			add_location(br0, file$7, 57, 0, 1654);
    			add_location(br1, file$7, 57, 4, 1658);
    			add_location(br2, file$7, 57, 8, 1662);
    			add_location(br3, file$7, 57, 12, 1666);
    			set_style(hr, "height", "7px");
    			set_style(hr, "visibility", "hidden");
    			add_location(hr, file$7, 57, 16, 1670);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div2);
    			mount_component(undobutton, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			mount_component(startlocationdropdown, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(mobilitybox, div1, null);
    			append_dev(div8, t2);
    			append_dev(div8, div7);
    			append_dev(div7, div3);
    			append_dev(div7, t4);
    			append_dev(div7, div4);
    			mount_component(dockedbox, div4, null);
    			append_dev(div7, t5);
    			append_dev(div7, div5);
    			mount_component(balancedbox, div5, null);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div9, anchor);
    			mount_component(gamepiececombo, div9, null);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			mount_component(scoringlocationcombo, div10, null);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, hr, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(undobutton.$$.fragment, local);
    			transition_in(startlocationdropdown.$$.fragment, local);
    			transition_in(mobilitybox.$$.fragment, local);
    			transition_in(dockedbox.$$.fragment, local);
    			transition_in(balancedbox.$$.fragment, local);
    			transition_in(gamepiececombo.$$.fragment, local);
    			transition_in(scoringlocationcombo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(undobutton.$$.fragment, local);
    			transition_out(startlocationdropdown.$$.fragment, local);
    			transition_out(mobilitybox.$$.fragment, local);
    			transition_out(dockedbox.$$.fragment, local);
    			transition_out(balancedbox.$$.fragment, local);
    			transition_out(gamepiececombo.$$.fragment, local);
    			transition_out(scoringlocationcombo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_component(undobutton);
    			destroy_component(startlocationdropdown);
    			destroy_component(mobilitybox);
    			destroy_component(dockedbox);
    			destroy_component(balancedbox);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div9);
    			destroy_component(gamepiececombo);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div11);
    			destroy_component(scoringlocationcombo);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $autoGameData;
    	let $autoStack;
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(0, $autoGameData = $$value));
    	validate_store(autoStack, 'autoStack');
    	component_subscribe($$self, autoStack, $$value => $$invalidate(1, $autoStack = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Auto', slots, []);

    	if ($autoStack.length === 0) {
    		$autoStack.push(JSON.parse(JSON.stringify($autoGameData)));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Auto> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ScoringLocation,
    		ScoringLocationCombo,
    		TrashCan,
    		GamePiece,
    		GamePieceCombo,
    		StartLocationDropdown,
    		MobilityBox,
    		DockedBox,
    		BalancedBox,
    		UndoButton,
    		autoGameData,
    		autoStack,
    		$autoGameData,
    		$autoStack
    	});

    	return [];
    }

    class Auto extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Auto",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Tele.svelte generated by Svelte v3.55.1 */
    const file$6 = "src\\Tele.svelte";

    function create_fragment$7(ctx) {
    	let div0;
    	let gamepiececombo;
    	let t0;
    	let div2;
    	let div1;
    	let undobutton;
    	let t1;
    	let div7;
    	let div3;
    	let t3;
    	let div4;
    	let dockedbox;
    	let t4;
    	let div5;
    	let balancedbox;
    	let t5;
    	let div6;
    	let t7;
    	let div9;
    	let div8;
    	let scoringlocationcombo;
    	let t8;
    	let br0;
    	let br1;
    	let br2;
    	let br3;
    	let hr;
    	let current;

    	gamepiececombo = new GamePieceCombo({
    			props: { class: "mx-auto" },
    			$$inline: true
    		});

    	undobutton = new UndoButton({ $$inline: true });
    	dockedbox = new DockedBox({ $$inline: true });
    	balancedbox = new BalancedBox({ $$inline: true });
    	scoringlocationcombo = new ScoringLocationCombo({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(gamepiececombo.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(undobutton.$$.fragment);
    			t1 = space();
    			div7 = element("div");
    			div3 = element("div");
    			div3.textContent = "Tele";
    			t3 = space();
    			div4 = element("div");
    			create_component(dockedbox.$$.fragment);
    			t4 = space();
    			div5 = element("div");
    			create_component(balancedbox.$$.fragment);
    			t5 = space();
    			div6 = element("div");
    			div6.textContent = "6328";
    			t7 = space();
    			div9 = element("div");
    			div8 = element("div");
    			create_component(scoringlocationcombo.$$.fragment);
    			t8 = space();
    			br0 = element("br");
    			br1 = element("br");
    			br2 = element("br");
    			br3 = element("br");
    			hr = element("hr");
    			attr_dev(div0, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div0, file$6, 8, 0, 306);
    			attr_dev(div1, "class", "flex justify-center mr-[320px]");
    			add_location(div1, file$6, 13, 4, 467);
    			attr_dev(div2, "class", "z-20 pt-4 xl:pl-0xl:pl-8 z-10");
    			add_location(div2, file$6, 12, 0, 417);
    			attr_dev(div3, "class", "text-3xl mt-7 ");
    			add_location(div3, file$6, 19, 4, 603);
    			attr_dev(div4, "class", "ml-11");
    			add_location(div4, file$6, 22, 4, 663);
    			attr_dev(div5, "class", "ml-16");
    			add_location(div5, file$6, 25, 4, 722);
    			attr_dev(div6, "class", "text-3xl mt-8 ml-8");
    			add_location(div6, file$6, 28, 4, 783);
    			attr_dev(div7, "class", "flex justify-center -mt-1");
    			add_location(div7, file$6, 18, 0, 558);
    			attr_dev(div8, "class", "mt-6");
    			add_location(div8, file$6, 35, 4, 926);
    			attr_dev(div9, "class", "pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10");
    			add_location(div9, file$6, 34, 0, 855);
    			add_location(br0, file$6, 40, 0, 1001);
    			add_location(br1, file$6, 40, 4, 1005);
    			add_location(br2, file$6, 40, 8, 1009);
    			add_location(br3, file$6, 40, 12, 1013);
    			set_style(hr, "height", "7px");
    			set_style(hr, "visibility", "hidden");
    			add_location(hr, file$6, 40, 16, 1017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(gamepiececombo, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			mount_component(undobutton, div1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div3);
    			append_dev(div7, t3);
    			append_dev(div7, div4);
    			mount_component(dockedbox, div4, null);
    			append_dev(div7, t4);
    			append_dev(div7, div5);
    			mount_component(balancedbox, div5, null);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			mount_component(scoringlocationcombo, div8, null);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, hr, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamepiececombo.$$.fragment, local);
    			transition_in(undobutton.$$.fragment, local);
    			transition_in(dockedbox.$$.fragment, local);
    			transition_in(balancedbox.$$.fragment, local);
    			transition_in(scoringlocationcombo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamepiececombo.$$.fragment, local);
    			transition_out(undobutton.$$.fragment, local);
    			transition_out(dockedbox.$$.fragment, local);
    			transition_out(balancedbox.$$.fragment, local);
    			transition_out(scoringlocationcombo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(gamepiececombo);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			destroy_component(undobutton);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div7);
    			destroy_component(dockedbox);
    			destroy_component(balancedbox);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div9);
    			destroy_component(scoringlocationcombo);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tele', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tele> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		GamePieceCombo,
    		ScoringLocationCombo,
    		UndoButton,
    		DockedBox,
    		BalancedBox
    	});

    	return [];
    }

    class Tele extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tele",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\StarRating.svelte generated by Svelte v3.55.1 */
    const file$5 = "src\\StarRating.svelte";

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let input4;
    	let t6;
    	let input5;
    	let t7;
    	let input6;
    	let t8;
    	let input7;
    	let t9;
    	let input8;
    	let t10;
    	let input9;
    	let t11;
    	let input10;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			input4 = element("input");
    			t6 = space();
    			input5 = element("input");
    			t7 = space();
    			input6 = element("input");
    			t8 = space();
    			input7 = element("input");
    			t9 = space();
    			input8 = element("input");
    			t10 = space();
    			input9 = element("input");
    			t11 = space();
    			input10 = element("input");
    			attr_dev(div0, "class", "text-3xl mt-2");
    			add_location(div0, file$5, 16, 0, 410);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", /*name*/ ctx[0]);
    			attr_dev(input0, "class", "rating-hidden");
    			input0.checked = true;
    			input0.__value = 0;
    			input0.value = input0.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input0);
    			add_location(input0, file$5, 21, 4, 514);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", /*name*/ ctx[0]);
    			attr_dev(input1, "class", "bg-primary mask mask-star-2 mask-half-1");
    			input1.__value = 0.5;
    			input1.value = input1.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input1);
    			add_location(input1, file$5, 22, 4, 635);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", /*name*/ ctx[0]);
    			attr_dev(input2, "class", "bg-primary mask mask-star-2 mask-half-2");
    			input2.__value = 1;
    			input2.value = input2.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input2);
    			add_location(input2, file$5, 23, 4, 775);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "name", /*name*/ ctx[0]);
    			attr_dev(input3, "class", "bg-primary mask mask-star-2 mask-half-1");
    			input3.__value = 1.5;
    			input3.value = input3.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input3);
    			add_location(input3, file$5, 24, 4, 913);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "name", /*name*/ ctx[0]);
    			attr_dev(input4, "class", "bg-primary mask mask-star-2 mask-half-2");
    			input4.__value = 2;
    			input4.value = input4.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input4);
    			add_location(input4, file$5, 25, 4, 1053);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "name", /*name*/ ctx[0]);
    			attr_dev(input5, "class", "bg-primary mask mask-star-2 mask-half-1");
    			input5.__value = 2.5;
    			input5.value = input5.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input5);
    			add_location(input5, file$5, 26, 4, 1191);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "name", /*name*/ ctx[0]);
    			attr_dev(input6, "class", "bg-primary mask mask-star-2 mask-half-2");
    			input6.__value = 3;
    			input6.value = input6.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input6);
    			add_location(input6, file$5, 27, 4, 1331);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "name", /*name*/ ctx[0]);
    			attr_dev(input7, "class", "bg-primary mask mask-star-2 mask-half-1");
    			input7.__value = 3.5;
    			input7.value = input7.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input7);
    			add_location(input7, file$5, 28, 4, 1469);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "name", /*name*/ ctx[0]);
    			attr_dev(input8, "class", "bg-primary mask mask-star-2 mask-half-2");
    			input8.__value = 4;
    			input8.value = input8.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input8);
    			add_location(input8, file$5, 29, 4, 1609);
    			attr_dev(input9, "type", "radio");
    			attr_dev(input9, "name", /*name*/ ctx[0]);
    			attr_dev(input9, "class", "bg-primary mask mask-star-2 mask-half-1");
    			input9.__value = 4.5;
    			input9.value = input9.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input9);
    			add_location(input9, file$5, 30, 4, 1747);
    			attr_dev(input10, "type", "radio");
    			attr_dev(input10, "name", /*name*/ ctx[0]);
    			attr_dev(input10, "class", "bg-primary mask mask-star-2 mask-half-2");
    			input10.__value = 5;
    			input10.value = input10.__value;
    			/*$$binding_groups*/ ctx[5][0].push(input10);
    			add_location(input10, file$5, 31, 4, 1887);
    			attr_dev(div1, "class", "rating rating-lg rating-half mt-2");
    			add_location(div1, file$5, 20, 0, 461);
    			attr_dev(div2, "class", "flex flex-col items-center justify-center");
    			add_location(div2, file$5, 14, 0, 351);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			input0.checked = input0.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t2);
    			append_dev(div1, input1);
    			input1.checked = input1.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t3);
    			append_dev(div1, input2);
    			input2.checked = input2.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t4);
    			append_dev(div1, input3);
    			input3.checked = input3.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t5);
    			append_dev(div1, input4);
    			input4.checked = input4.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t6);
    			append_dev(div1, input5);
    			input5.checked = input5.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t7);
    			append_dev(div1, input6);
    			input6.checked = input6.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t8);
    			append_dev(div1, input7);
    			input7.checked = input7.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t9);
    			append_dev(div1, input8);
    			input8.checked = input8.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t10);
    			append_dev(div1, input9);
    			input9.checked = input9.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			append_dev(div1, t11);
    			append_dev(div1, input10);
    			input10.checked = input10.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[4]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[6]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[7]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[8]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[9]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[10]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[11]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[12]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[13]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[14]),
    					listen_dev(input10, "change", /*input10_change_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);

    			if (dirty & /*name*/ 1) {
    				attr_dev(input0, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input0.checked = input0.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input1, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input1.checked = input1.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input2, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input2.checked = input2.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input3, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input3.checked = input3.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input4, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input4.checked = input4.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input5, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input5.checked = input5.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input6, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input6.checked = input6.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input7, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input7.checked = input7.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input8, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input8.checked = input8.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input9, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input9.checked = input9.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(input10, "name", /*name*/ ctx[0]);
    			}

    			if (dirty & /*$postGameData, realName*/ 6) {
    				input10.checked = input10.__value === /*$postGameData*/ ctx[1][/*realName*/ ctx[2]];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input0), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input2), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input3), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input4), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input5), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input6), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input7), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input8), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input9), 1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input10), 1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $postGameData;
    	validate_store(postGameData, 'postGameData');
    	component_subscribe($$self, postGameData, $$value => $$invalidate(1, $postGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StarRating', slots, []);

    	let nameConverter = {
    		"Defense Rating": "defenseRating",
    		"Driver Rating": "driverRating",
    		"Intake Rating": "intakeRating"
    	};

    	let { name = "Empty_Name" } = $$props;
    	let realName = nameConverter[name];
    	let { value } = $$props;
    	let group = 0;

    	$$self.$$.on_mount.push(function () {
    		if (value === undefined && !('value' in $$props || $$self.$$.bound[$$self.$$.props['value']])) {
    			console.warn("<StarRating> was created without expected prop 'value'");
    		}
    	});

    	const writable_props = ['name', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StarRating> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input1_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input2_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input3_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input4_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input5_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input6_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input7_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input8_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input9_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	function input10_change_handler() {
    		$postGameData[realName] = this.__value;
    		postGameData.set($postGameData);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('value' in $$props) $$invalidate(3, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		postGameData,
    		nameConverter,
    		name,
    		realName,
    		value,
    		group,
    		$postGameData
    	});

    	$$self.$inject_state = $$props => {
    		if ('nameConverter' in $$props) nameConverter = $$props.nameConverter;
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('realName' in $$props) $$invalidate(2, realName = $$props.realName);
    		if ('value' in $$props) $$invalidate(3, value = $$props.value);
    		if ('group' in $$props) group = $$props.group;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		$postGameData,
    		realName,
    		value,
    		input0_change_handler,
    		$$binding_groups,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_change_handler,
    		input9_change_handler,
    		input10_change_handler
    	];
    }

    class StarRating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { name: 0, value: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StarRating",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get name() {
    		throw new Error("<StarRating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<StarRating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<StarRating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<StarRating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SliderRating.svelte generated by Svelte v3.55.1 */
    const file$4 = "src\\SliderRating.svelte";

    function create_fragment$5(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let div2;
    	let input;
    	let t2;
    	let div1;
    	let span0;
    	let t4;
    	let span1;
    	let t6;
    	let span2;
    	let t8;
    	let span3;
    	let t10;
    	let span4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			div2 = element("div");
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "0%";
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "25%";
    			t6 = space();
    			span2 = element("span");
    			span2.textContent = "50%";
    			t8 = space();
    			span3 = element("span");
    			span3.textContent = "75%";
    			t10 = space();
    			span4 = element("span");
    			span4.textContent = "100%";
    			attr_dev(div0, "class", "text-3xl mt-2");
    			add_location(div0, file$4, 16, 0, 349);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "class", "range range-primary");
    			attr_dev(input, "step", "25");
    			add_location(input, file$4, 20, 0, 423);
    			add_location(span0, file$4, 22, 4, 601);
    			add_location(span1, file$4, 23, 4, 622);
    			add_location(span2, file$4, 24, 4, 644);
    			add_location(span3, file$4, 25, 4, 666);
    			add_location(span4, file$4, 26, 4, 688);
    			attr_dev(div1, "class", "w-[270px] flex justify-between text-s px-2");
    			add_location(div1, file$4, 21, 0, 539);
    			attr_dev(div2, "class", "w-64 mt-2");
    			add_location(div2, file$4, 19, 0, 398);
    			attr_dev(div3, "class", "flex flex-col items-center justify-center");
    			add_location(div3, file$4, 14, 0, 290);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*$postGameData*/ ctx[1][/*realName*/ ctx[2]]);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t4);
    			append_dev(div1, span1);
    			append_dev(div1, t6);
    			append_dev(div1, span2);
    			append_dev(div1, t8);
    			append_dev(div1, span3);
    			append_dev(div1, t10);
    			append_dev(div1, span4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[3]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);

    			if (dirty & /*$postGameData, realName*/ 6) {
    				set_input_value(input, /*$postGameData*/ ctx[1][/*realName*/ ctx[2]]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $postGameData;
    	validate_store(postGameData, 'postGameData');
    	component_subscribe($$self, postGameData, $$value => $$invalidate(1, $postGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SliderRating', slots, []);
    	let { name = "Empty_Name" } = $$props;

    	let nameConverter = {
    		"Defense Duration": "defenseDuration",
    		"Rec. Defense Duration": "recDefenseDuration"
    	};

    	let realName = nameConverter[name];
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SliderRating> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		$postGameData[realName] = to_number(this.value);
    		postGameData.set($postGameData);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		postGameData,
    		name,
    		nameConverter,
    		realName,
    		$postGameData
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('nameConverter' in $$props) nameConverter = $$props.nameConverter;
    		if ('realName' in $$props) $$invalidate(2, realName = $$props.realName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, $postGameData, realName, input_change_input_handler];
    }

    class SliderRating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SliderRating",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get name() {
    		throw new Error("<SliderRating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SliderRating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\NotesBox.svelte generated by Svelte v3.55.1 */
    const file$3 = "src\\NotesBox.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Notes";
    			t1 = space();
    			textarea = element("textarea");
    			attr_dev(div0, "class", "text-3xl mt-2");
    			add_location(div0, file$3, 11, 4, 196);
    			attr_dev(textarea, "placeholder", "Notes");
    			attr_dev(textarea, "class", "textarea textarea-bordered textarea-primary textarea-lg w-72 h-48 max-w-xs");
    			add_location(textarea, file$3, 15, 4, 258);
    			attr_dev(div1, "class", "flex flex-col items-center justify-center");
    			add_location(div1, file$3, 9, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*$postGameData*/ ctx[0]["notes"]);

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$postGameData*/ 1) {
    				set_input_value(textarea, /*$postGameData*/ ctx[0]["notes"]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $postGameData;
    	validate_store(postGameData, 'postGameData');
    	component_subscribe($$self, postGameData, $$value => $$invalidate(0, $postGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotesBox', slots, []);
    	let { name = "Empty_Name" } = $$props;
    	let { value } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (value === undefined && !('value' in $$props || $$self.$$.bound[$$self.$$.props['value']])) {
    			console.warn("<NotesBox> was created without expected prop 'value'");
    		}
    	});

    	const writable_props = ['name', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotesBox> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		$postGameData["notes"] = this.value;
    		postGameData.set($postGameData);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('value' in $$props) $$invalidate(2, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ postGameData, name, value, $postGameData });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('value' in $$props) $$invalidate(2, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$postGameData, name, value, textarea_input_handler];
    }

    class NotesBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 1, value: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotesBox",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get name() {
    		throw new Error("<NotesBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<NotesBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<NotesBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<NotesBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Post.svelte generated by Svelte v3.55.1 */
    const file$2 = "src\\Post.svelte";

    function create_fragment$3(ctx) {
    	let div0;
    	let gamepiececombo;
    	let t0;
    	let div1;
    	let sliderrating0;
    	let t1;
    	let starrating0;
    	let t2;
    	let sliderrating1;
    	let t3;
    	let starrating1;
    	let t4;
    	let starrating2;
    	let t5;
    	let notesbox;
    	let current;

    	gamepiececombo = new GamePieceCombo({
    			props: { class: "mx-auto", type: "post" },
    			$$inline: true
    		});

    	sliderrating0 = new SliderRating({
    			props: { name: "Defense Duration" },
    			$$inline: true
    		});

    	starrating0 = new StarRating({
    			props: { name: "Defense Rating" },
    			$$inline: true
    		});

    	sliderrating1 = new SliderRating({
    			props: { name: "Rec. Defense Duration" },
    			$$inline: true
    		});

    	starrating1 = new StarRating({
    			props: { name: "Driver Rating" },
    			$$inline: true
    		});

    	starrating2 = new StarRating({
    			props: { name: "Intake Rating" },
    			$$inline: true
    		});

    	notesbox = new NotesBox({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(gamepiececombo.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(sliderrating0.$$.fragment);
    			t1 = space();
    			create_component(starrating0.$$.fragment);
    			t2 = space();
    			create_component(sliderrating1.$$.fragment);
    			t3 = space();
    			create_component(starrating1.$$.fragment);
    			t4 = space();
    			create_component(starrating2.$$.fragment);
    			t5 = space();
    			create_component(notesbox.$$.fragment);
    			attr_dev(div0, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div0, file$2, 7, 0, 235);
    			attr_dev(div1, "class", "flex flex-col items-center justify-center m-10");
    			add_location(div1, file$2, 10, 1, 357);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(gamepiececombo, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(sliderrating0, div1, null);
    			append_dev(div1, t1);
    			mount_component(starrating0, div1, null);
    			append_dev(div1, t2);
    			mount_component(sliderrating1, div1, null);
    			append_dev(div1, t3);
    			mount_component(starrating1, div1, null);
    			append_dev(div1, t4);
    			mount_component(starrating2, div1, null);
    			append_dev(div1, t5);
    			mount_component(notesbox, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamepiececombo.$$.fragment, local);
    			transition_in(sliderrating0.$$.fragment, local);
    			transition_in(starrating0.$$.fragment, local);
    			transition_in(sliderrating1.$$.fragment, local);
    			transition_in(starrating1.$$.fragment, local);
    			transition_in(starrating2.$$.fragment, local);
    			transition_in(notesbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamepiececombo.$$.fragment, local);
    			transition_out(sliderrating0.$$.fragment, local);
    			transition_out(starrating0.$$.fragment, local);
    			transition_out(sliderrating1.$$.fragment, local);
    			transition_out(starrating1.$$.fragment, local);
    			transition_out(starrating2.$$.fragment, local);
    			transition_out(notesbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(gamepiececombo);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(sliderrating0);
    			destroy_component(starrating0);
    			destroy_component(sliderrating1);
    			destroy_component(starrating1);
    			destroy_component(starrating2);
    			destroy_component(notesbox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Post', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		GamePieceCombo,
    		StarRating,
    		SliderRating,
    		NotesBox
    	});

    	return [];
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*
     * QRious v4.0.2
     * Copyright (C) 2017 Alasdair Mercer
     * Copyright (C) 2010 Tom Zerucha
     *
     * This program is free software: you can redistribute it and/or modify
     * it under the terms of the GNU General Public License as published by
     * the Free Software Foundation, either version 3 of the License, or
     * (at your option) any later version.
     *
     * This program is distributed in the hope that it will be useful,
     * but WITHOUT ANY WARRANTY; without even the implied warranty of
     * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     * GNU General Public License for more details.
     *
     * You should have received a copy of the GNU General Public License
     * along with this program.  If not, see <http://www.gnu.org/licenses/>.
     */

    var qrcode = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
        module.exports = factory() ;
      }(commonjsGlobal, (function () {  
        /*
         * Copyright (C) 2017 Alasdair Mercer, !ninja
         *
         * Permission is hereby granted, free of charge, to any person obtaining a copy
         * of this software and associated documentation files (the "Software"), to deal
         * in the Software without restriction, including without limitation the rights
         * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
         * copies of the Software, and to permit persons to whom the Software is
         * furnished to do so, subject to the following conditions:
         *
         * The above copyright notice and this permission notice shall be included in all
         * copies or substantial portions of the Software.
         *
         * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
         * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
         * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
         * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
         * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
         * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
         * SOFTWARE.
         */
      
        /**
         * A bare-bones constructor for surrogate prototype swapping.
         *
         * @private
         * @constructor
         */
        var Constructor = /* istanbul ignore next */ function() {};
        /**
         * A reference to <code>Object.prototype.hasOwnProperty</code>.
         *
         * @private
         * @type {Function}
         */
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        /**
         * A reference to <code>Array.prototype.slice</code>.
         *
         * @private
         * @type {Function}
         */
        var slice = Array.prototype.slice;
      
        /**
         * Creates an object which inherits the given <code>prototype</code>.
         *
         * Optionally, the created object can be extended further with the specified <code>properties</code>.
         *
         * @param {Object} prototype - the prototype to be inherited by the created object
         * @param {Object} [properties] - the optional properties to be extended by the created object
         * @return {Object} The newly created object.
         * @private
         */
        function createObject(prototype, properties) {
          var result;
          /* istanbul ignore next */
          if (typeof Object.create === 'function') {
            result = Object.create(prototype);
          } else {
            Constructor.prototype = prototype;
            result = new Constructor();
            Constructor.prototype = null;
          }
      
          if (properties) {
            extendObject(true, result, properties);
          }
      
          return result;
        }
      
        /**
         * Extends the constructor to which this method is associated with the <code>prototype</code> and/or
         * <code>statics</code> provided.
         *
         * If <code>name</code> is provided, it will be used as the class name and can be accessed via a special
         * <code>class_</code> property on the child constructor, otherwise the class name of the super constructor will be used
         * instead. The class name may also be used string representation for instances of the child constructor (via
         * <code>toString</code>), but this is not applicable to the <i>lite</i> version of Nevis.
         *
         * If <code>constructor</code> is provided, it will be used as the constructor for the child, otherwise a simple
         * constructor which only calls the super constructor will be used instead.
         *
         * The super constructor can be accessed via a special <code>super_</code> property on the child constructor.
         *
         * @param {string} [name=this.class_] - the class name to be used for the child constructor
         * @param {Function} [constructor] - the constructor for the child
         * @param {Object} [prototype] - the prototype properties to be defined for the child
         * @param {Object} [statics] - the static properties to be defined for the child
         * @return {Function} The child <code>constructor</code> provided or the one created if none was given.
         * @public
         */
        function extend(name, constructor, prototype, statics) {
          var superConstructor = this;
      
          if (typeof name !== 'string') {
            statics = prototype;
            prototype = constructor;
            constructor = name;
            name = null;
          }
      
          if (typeof constructor !== 'function') {
            statics = prototype;
            prototype = constructor;
            constructor = function() {
              return superConstructor.apply(this, arguments);
            };
          }
      
          extendObject(false, constructor, superConstructor, statics);
      
          constructor.prototype = createObject(superConstructor.prototype, prototype);
          constructor.prototype.constructor = constructor;
      
          constructor.class_ = name || superConstructor.class_;
          constructor.super_ = superConstructor;
      
          return constructor;
        }
      
        /**
         * Extends the specified <code>target</code> object with the properties in each of the <code>sources</code> provided.
         *
         * if any source is <code>null</code> it will be ignored.
         *
         * @param {boolean} own - <code>true</code> to only copy <b>own</b> properties from <code>sources</code> onto
         * <code>target</code>; otherwise <code>false</code>
         * @param {Object} target - the target object which should be extended
         * @param {...Object} [sources] - the source objects whose properties are to be copied onto <code>target</code>
         * @return {void}
         * @private
         */
        function extendObject(own, target, sources) {
          sources = slice.call(arguments, 2);
      
          var property;
          var source;
      
          for (var i = 0, length = sources.length; i < length; i++) {
            source = sources[i];
      
            for (property in source) {
              if (!own || hasOwnProperty.call(source, property)) {
                target[property] = source[property];
              }
            }
          }
        }
      
        var extend_1 = extend;
      
        /**
         * The base class from which all others should extend.
         *
         * @public
         * @constructor
         */
        function Nevis() {}
        Nevis.class_ = 'Nevis';
        Nevis.super_ = Object;
      
        /**
         * Extends the constructor to which this method is associated with the <code>prototype</code> and/or
         * <code>statics</code> provided.
         *
         * If <code>name</code> is provided, it will be used as the class name and can be accessed via a special
         * <code>class_</code> property on the child constructor, otherwise the class name of the super constructor will be used
         * instead. The class name may also be used string representation for instances of the child constructor (via
         * <code>toString</code>), but this is not applicable to the <i>lite</i> version of Nevis.
         *
         * If <code>constructor</code> is provided, it will be used as the constructor for the child, otherwise a simple
         * constructor which only calls the super constructor will be used instead.
         *
         * The super constructor can be accessed via a special <code>super_</code> property on the child constructor.
         *
         * @param {string} [name=this.class_] - the class name to be used for the child constructor
         * @param {Function} [constructor] - the constructor for the child
         * @param {Object} [prototype] - the prototype properties to be defined for the child
         * @param {Object} [statics] - the static properties to be defined for the child
         * @return {Function} The child <code>constructor</code> provided or the one created if none was given.
         * @public
         * @static
         * @memberof Nevis
         */
        Nevis.extend = extend_1;
      
        var nevis = Nevis;
      
        var lite = nevis;
      
        /**
         * Responsible for rendering a QR code {@link Frame} on a specific type of element.
         *
         * A renderer may be dependant on the rendering of another element, so the ordering of their execution is important.
         *
         * The rendering of a element can be deferred by disabling the renderer initially, however, any attempt get the element
         * from the renderer will result in it being immediately enabled and the element being rendered.
         *
         * @param {QRious} qrious - the {@link QRious} instance to be used
         * @param {*} element - the element onto which the QR code is to be rendered
         * @param {boolean} [enabled] - <code>true</code> this {@link Renderer} is enabled; otherwise <code>false</code>.
         * @public
         * @class
         * @extends Nevis
         */
        var Renderer = lite.extend(function(qrious, element, enabled) {
          /**
           * The {@link QRious} instance.
           *
           * @protected
           * @type {QRious}
           * @memberof Renderer#
           */
          this.qrious = qrious;
      
          /**
           * The element onto which this {@link Renderer} is rendering the QR code.
           *
           * @protected
           * @type {*}
           * @memberof Renderer#
           */
          this.element = element;
          this.element.qrious = qrious;
      
          /**
           * Whether this {@link Renderer} is enabled.
           *
           * @protected
           * @type {boolean}
           * @memberof Renderer#
           */
          this.enabled = Boolean(enabled);
        }, {
      
          /**
           * Draws the specified QR code <code>frame</code> on the underlying element.
           *
           * Implementations of {@link Renderer} <b>must</b> override this method with their own specific logic.
           *
           * @param {Frame} frame - the {@link Frame} to be drawn
           * @return {void}
           * @protected
           * @abstract
           * @memberof Renderer#
           */
          draw: function(frame) {},
      
          /**
           * Returns the element onto which this {@link Renderer} is rendering the QR code.
           *
           * If this method is called while this {@link Renderer} is disabled, it will be immediately enabled and rendered
           * before the element is returned.
           *
           * @return {*} The element.
           * @public
           * @memberof Renderer#
           */
          getElement: function() {
            if (!this.enabled) {
              this.enabled = true;
              this.render();
            }
      
            return this.element;
          },
      
          /**
           * Calculates the size (in pixel units) to represent an individual module within the QR code based on the
           * <code>frame</code> provided.
           *
           * Any configured padding will be excluded from the returned size.
           *
           * The returned value will be at least one, even in cases where the size of the QR code does not fit its contents.
           * This is done so that the inevitable clipping is handled more gracefully since this way at least something is
           * displayed instead of just a blank space filled by the background color.
           *
           * @param {Frame} frame - the {@link Frame} from which the module size is to be derived
           * @return {number} The pixel size for each module in the QR code which will be no less than one.
           * @protected
           * @memberof Renderer#
           */
          getModuleSize: function(frame) {
            var qrious = this.qrious;
            var padding = qrious.padding || 0;
            var pixels = Math.floor((qrious.size - (padding * 2)) / frame.width);
      
            return Math.max(1, pixels);
          },

          /**
           * Renders a QR code on the underlying element based on the <code>frame</code> provided.
           *
           * @param {Frame} frame - the {@link Frame} to be rendered
           * @return {void}
           * @public
           * @memberof Renderer#
           */
          render: function(frame) {
            if (this.enabled) {
              this.resize();
              this.reset();
              this.draw(frame);
            }
          },
      
          /**
           * Resets the underlying element, effectively clearing any previously rendered QR code.
           *
           * Implementations of {@link Renderer} <b>must</b> override this method with their own specific logic.
           *
           * @return {void}
           * @protected
           * @abstract
           * @memberof Renderer#
           */
          reset: function() {},
      
          /**
           * Ensures that the size of the underlying element matches that defined on the associated {@link QRious} instance.
           *
           * Implementations of {@link Renderer} <b>must</b> override this method with their own specific logic.
           *
           * @return {void}
           * @protected
           * @abstract
           * @memberof Renderer#
           */
          resize: function() {}
      
        });
      
        var Renderer_1 = Renderer;
      
        /**
         * An implementation of {@link Renderer} for working with <code>canvas</code> elements.
         *
         * @public
         * @class
         * @extends Renderer
         */
        var CanvasRenderer = Renderer_1.extend({
      
          /**
           * @override
           */
          draw: function(frame) {
            var i, j;
            var qrious = this.qrious;
            var moduleSize = this.getModuleSize(frame);
            var offset = parseInt((this.element.width-(frame.width * moduleSize)) / 2);
            var context = this.element.getContext('2d');
      
            context.fillStyle = qrious.foreground;
            context.globalAlpha = qrious.foregroundAlpha;
      
            for (i = 0; i < frame.width; i++) {
              for (j = 0; j < frame.width; j++) {
                if (frame.buffer[(j * frame.width) + i]) {
                  context.fillRect((moduleSize * i) + offset, (moduleSize * j) + offset, moduleSize, moduleSize);
                }
              }
            }
          },
      
          /**
           * @override
           */
          reset: function() {
            var qrious = this.qrious;
            var context = this.element.getContext('2d');
            var size = qrious.size;
      
            context.lineWidth = 1;
            context.clearRect(0, 0, size, size);
            context.fillStyle = qrious.background;
            context.globalAlpha = qrious.backgroundAlpha;
            context.fillRect(0, 0, size, size);
          },
      
          /**
           * @override
           */
          resize: function() {
            var element = this.element;
      
            element.width = element.height = this.qrious.size;
          }
      
        });
      
        var CanvasRenderer_1 = CanvasRenderer;
      
        /* eslint no-multi-spaces: "off" */
      
      
      
        /**
         * Contains alignment pattern information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Alignment = lite.extend(null, {
      
          /**
           * The alignment pattern block.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Alignment
           */
          BLOCK: [
            0,  11, 15, 19, 23, 27, 31,
            16, 18, 20, 22, 24, 26, 28, 20, 22, 24, 24, 26, 28, 28, 22, 24, 24,
            26, 26, 28, 28, 24, 24, 26, 26, 26, 28, 28, 24, 26, 26, 26, 28, 28
          ]
      
        });
      
        var Alignment_1 = Alignment;
      
        /* eslint no-multi-spaces: "off" */
      
      
      
        /**
         * Contains error correction information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var ErrorCorrection = lite.extend(null, {
      
          /**
           * The error correction blocks.
           *
           * There are four elements per version. The first two indicate the number of blocks, then the data width, and finally
           * the ECC width.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof ErrorCorrection
           */
          BLOCKS: [
            1,  0,  19,  7,     1,  0,  16,  10,    1,  0,  13,  13,    1,  0,  9,   17,
            1,  0,  34,  10,    1,  0,  28,  16,    1,  0,  22,  22,    1,  0,  16,  28,
            1,  0,  55,  15,    1,  0,  44,  26,    2,  0,  17,  18,    2,  0,  13,  22,
            1,  0,  80,  20,    2,  0,  32,  18,    2,  0,  24,  26,    4,  0,  9,   16,
            1,  0,  108, 26,    2,  0,  43,  24,    2,  2,  15,  18,    2,  2,  11,  22,
            2,  0,  68,  18,    4,  0,  27,  16,    4,  0,  19,  24,    4,  0,  15,  28,
            2,  0,  78,  20,    4,  0,  31,  18,    2,  4,  14,  18,    4,  1,  13,  26,
            2,  0,  97,  24,    2,  2,  38,  22,    4,  2,  18,  22,    4,  2,  14,  26,
            2,  0,  116, 30,    3,  2,  36,  22,    4,  4,  16,  20,    4,  4,  12,  24,
            2,  2,  68,  18,    4,  1,  43,  26,    6,  2,  19,  24,    6,  2,  15,  28,
            4,  0,  81,  20,    1,  4,  50,  30,    4,  4,  22,  28,    3,  8,  12,  24,
            2,  2,  92,  24,    6,  2,  36,  22,    4,  6,  20,  26,    7,  4,  14,  28,
            4,  0,  107, 26,    8,  1,  37,  22,    8,  4,  20,  24,    12, 4,  11,  22,
            3,  1,  115, 30,    4,  5,  40,  24,    11, 5,  16,  20,    11, 5,  12,  24,
            5,  1,  87,  22,    5,  5,  41,  24,    5,  7,  24,  30,    11, 7,  12,  24,
            5,  1,  98,  24,    7,  3,  45,  28,    15, 2,  19,  24,    3,  13, 15,  30,
            1,  5,  107, 28,    10, 1,  46,  28,    1,  15, 22,  28,    2,  17, 14,  28,
            5,  1,  120, 30,    9,  4,  43,  26,    17, 1,  22,  28,    2,  19, 14,  28,
            3,  4,  113, 28,    3,  11, 44,  26,    17, 4,  21,  26,    9,  16, 13,  26,
            3,  5,  107, 28,    3,  13, 41,  26,    15, 5,  24,  30,    15, 10, 15,  28,
            4,  4,  116, 28,    17, 0,  42,  26,    17, 6,  22,  28,    19, 6,  16,  30,
            2,  7,  111, 28,    17, 0,  46,  28,    7,  16, 24,  30,    34, 0,  13,  24,
            4,  5,  121, 30,    4,  14, 47,  28,    11, 14, 24,  30,    16, 14, 15,  30,
            6,  4,  117, 30,    6,  14, 45,  28,    11, 16, 24,  30,    30, 2,  16,  30,
            8,  4,  106, 26,    8,  13, 47,  28,    7,  22, 24,  30,    22, 13, 15,  30,
            10, 2,  114, 28,    19, 4,  46,  28,    28, 6,  22,  28,    33, 4,  16,  30,
            8,  4,  122, 30,    22, 3,  45,  28,    8,  26, 23,  30,    12, 28, 15,  30,
            3,  10, 117, 30,    3,  23, 45,  28,    4,  31, 24,  30,    11, 31, 15,  30,
            7,  7,  116, 30,    21, 7,  45,  28,    1,  37, 23,  30,    19, 26, 15,  30,
            5,  10, 115, 30,    19, 10, 47,  28,    15, 25, 24,  30,    23, 25, 15,  30,
            13, 3,  115, 30,    2,  29, 46,  28,    42, 1,  24,  30,    23, 28, 15,  30,
            17, 0,  115, 30,    10, 23, 46,  28,    10, 35, 24,  30,    19, 35, 15,  30,
            17, 1,  115, 30,    14, 21, 46,  28,    29, 19, 24,  30,    11, 46, 15,  30,
            13, 6,  115, 30,    14, 23, 46,  28,    44, 7,  24,  30,    59, 1,  16,  30,
            12, 7,  121, 30,    12, 26, 47,  28,    39, 14, 24,  30,    22, 41, 15,  30,
            6,  14, 121, 30,    6,  34, 47,  28,    46, 10, 24,  30,    2,  64, 15,  30,
            17, 4,  122, 30,    29, 14, 46,  28,    49, 10, 24,  30,    24, 46, 15,  30,
            4,  18, 122, 30,    13, 32, 46,  28,    48, 14, 24,  30,    42, 32, 15,  30,
            20, 4,  117, 30,    40, 7,  47,  28,    43, 22, 24,  30,    10, 67, 15,  30,
            19, 6,  118, 30,    18, 31, 47,  28,    34, 34, 24,  30,    20, 61, 15,  30
          ],
      
          /**
           * The final format bits with mask (level << 3 | mask).
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof ErrorCorrection
           */
          FINAL_FORMAT: [
            // L
            0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
            // M
            0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
            // Q
            0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,
            // H
            0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b
          ],
      
          /**
           * A map of human-readable ECC levels.
           *
           * @public
           * @static
           * @type {Object.<string, number>}
           * @memberof ErrorCorrection
           */
          LEVELS: {
            L: 1,
            M: 2,
            Q: 3,
            H: 4
          }
      
        });
      
        var ErrorCorrection_1 = ErrorCorrection;
      
        /**
         * Contains Galois field information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Galois = lite.extend(null, {
      
          /**
           * The Galois field exponent table.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Galois
           */
          EXPONENT: [
            0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1d, 0x3a, 0x74, 0xe8, 0xcd, 0x87, 0x13, 0x26,
            0x4c, 0x98, 0x2d, 0x5a, 0xb4, 0x75, 0xea, 0xc9, 0x8f, 0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0,
            0x9d, 0x27, 0x4e, 0x9c, 0x25, 0x4a, 0x94, 0x35, 0x6a, 0xd4, 0xb5, 0x77, 0xee, 0xc1, 0x9f, 0x23,
            0x46, 0x8c, 0x05, 0x0a, 0x14, 0x28, 0x50, 0xa0, 0x5d, 0xba, 0x69, 0xd2, 0xb9, 0x6f, 0xde, 0xa1,
            0x5f, 0xbe, 0x61, 0xc2, 0x99, 0x2f, 0x5e, 0xbc, 0x65, 0xca, 0x89, 0x0f, 0x1e, 0x3c, 0x78, 0xf0,
            0xfd, 0xe7, 0xd3, 0xbb, 0x6b, 0xd6, 0xb1, 0x7f, 0xfe, 0xe1, 0xdf, 0xa3, 0x5b, 0xb6, 0x71, 0xe2,
            0xd9, 0xaf, 0x43, 0x86, 0x11, 0x22, 0x44, 0x88, 0x0d, 0x1a, 0x34, 0x68, 0xd0, 0xbd, 0x67, 0xce,
            0x81, 0x1f, 0x3e, 0x7c, 0xf8, 0xed, 0xc7, 0x93, 0x3b, 0x76, 0xec, 0xc5, 0x97, 0x33, 0x66, 0xcc,
            0x85, 0x17, 0x2e, 0x5c, 0xb8, 0x6d, 0xda, 0xa9, 0x4f, 0x9e, 0x21, 0x42, 0x84, 0x15, 0x2a, 0x54,
            0xa8, 0x4d, 0x9a, 0x29, 0x52, 0xa4, 0x55, 0xaa, 0x49, 0x92, 0x39, 0x72, 0xe4, 0xd5, 0xb7, 0x73,
            0xe6, 0xd1, 0xbf, 0x63, 0xc6, 0x91, 0x3f, 0x7e, 0xfc, 0xe5, 0xd7, 0xb3, 0x7b, 0xf6, 0xf1, 0xff,
            0xe3, 0xdb, 0xab, 0x4b, 0x96, 0x31, 0x62, 0xc4, 0x95, 0x37, 0x6e, 0xdc, 0xa5, 0x57, 0xae, 0x41,
            0x82, 0x19, 0x32, 0x64, 0xc8, 0x8d, 0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xdd, 0xa7, 0x53, 0xa6,
            0x51, 0xa2, 0x59, 0xb2, 0x79, 0xf2, 0xf9, 0xef, 0xc3, 0x9b, 0x2b, 0x56, 0xac, 0x45, 0x8a, 0x09,
            0x12, 0x24, 0x48, 0x90, 0x3d, 0x7a, 0xf4, 0xf5, 0xf7, 0xf3, 0xfb, 0xeb, 0xcb, 0x8b, 0x0b, 0x16,
            0x2c, 0x58, 0xb0, 0x7d, 0xfa, 0xe9, 0xcf, 0x83, 0x1b, 0x36, 0x6c, 0xd8, 0xad, 0x47, 0x8e, 0x00
          ],
      
          /**
           * The Galois field log table.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Galois
           */
          LOG: [
            0xff, 0x00, 0x01, 0x19, 0x02, 0x32, 0x1a, 0xc6, 0x03, 0xdf, 0x33, 0xee, 0x1b, 0x68, 0xc7, 0x4b,
            0x04, 0x64, 0xe0, 0x0e, 0x34, 0x8d, 0xef, 0x81, 0x1c, 0xc1, 0x69, 0xf8, 0xc8, 0x08, 0x4c, 0x71,
            0x05, 0x8a, 0x65, 0x2f, 0xe1, 0x24, 0x0f, 0x21, 0x35, 0x93, 0x8e, 0xda, 0xf0, 0x12, 0x82, 0x45,
            0x1d, 0xb5, 0xc2, 0x7d, 0x6a, 0x27, 0xf9, 0xb9, 0xc9, 0x9a, 0x09, 0x78, 0x4d, 0xe4, 0x72, 0xa6,
            0x06, 0xbf, 0x8b, 0x62, 0x66, 0xdd, 0x30, 0xfd, 0xe2, 0x98, 0x25, 0xb3, 0x10, 0x91, 0x22, 0x88,
            0x36, 0xd0, 0x94, 0xce, 0x8f, 0x96, 0xdb, 0xbd, 0xf1, 0xd2, 0x13, 0x5c, 0x83, 0x38, 0x46, 0x40,
            0x1e, 0x42, 0xb6, 0xa3, 0xc3, 0x48, 0x7e, 0x6e, 0x6b, 0x3a, 0x28, 0x54, 0xfa, 0x85, 0xba, 0x3d,
            0xca, 0x5e, 0x9b, 0x9f, 0x0a, 0x15, 0x79, 0x2b, 0x4e, 0xd4, 0xe5, 0xac, 0x73, 0xf3, 0xa7, 0x57,
            0x07, 0x70, 0xc0, 0xf7, 0x8c, 0x80, 0x63, 0x0d, 0x67, 0x4a, 0xde, 0xed, 0x31, 0xc5, 0xfe, 0x18,
            0xe3, 0xa5, 0x99, 0x77, 0x26, 0xb8, 0xb4, 0x7c, 0x11, 0x44, 0x92, 0xd9, 0x23, 0x20, 0x89, 0x2e,
            0x37, 0x3f, 0xd1, 0x5b, 0x95, 0xbc, 0xcf, 0xcd, 0x90, 0x87, 0x97, 0xb2, 0xdc, 0xfc, 0xbe, 0x61,
            0xf2, 0x56, 0xd3, 0xab, 0x14, 0x2a, 0x5d, 0x9e, 0x84, 0x3c, 0x39, 0x53, 0x47, 0x6d, 0x41, 0xa2,
            0x1f, 0x2d, 0x43, 0xd8, 0xb7, 0x7b, 0xa4, 0x76, 0xc4, 0x17, 0x49, 0xec, 0x7f, 0x0c, 0x6f, 0xf6,
            0x6c, 0xa1, 0x3b, 0x52, 0x29, 0x9d, 0x55, 0xaa, 0xfb, 0x60, 0x86, 0xb1, 0xbb, 0xcc, 0x3e, 0x5a,
            0xcb, 0x59, 0x5f, 0xb0, 0x9c, 0xa9, 0xa0, 0x51, 0x0b, 0xf5, 0x16, 0xeb, 0x7a, 0x75, 0x2c, 0xd7,
            0x4f, 0xae, 0xd5, 0xe9, 0xe6, 0xe7, 0xad, 0xe8, 0x74, 0xd6, 0xf4, 0xea, 0xa8, 0x50, 0x58, 0xaf
          ]
      
        });
      
        var Galois_1 = Galois;
      
        /**
         * Contains version pattern information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Version = lite.extend(null, {
      
          /**
           * The version pattern block.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Version
           */
          BLOCK: [
            0xc94, 0x5bc, 0xa99, 0x4d3, 0xbf6, 0x762, 0x847, 0x60d, 0x928, 0xb78, 0x45d, 0xa17, 0x532,
            0x9a6, 0x683, 0x8c9, 0x7ec, 0xec4, 0x1e1, 0xfab, 0x08e, 0xc1a, 0x33f, 0xd75, 0x250, 0x9d5,
            0x6f0, 0x8ba, 0x79f, 0xb0b, 0x42e, 0xa64, 0x541, 0xc69
          ]
      
        });
      
        var Version_1 = Version;
      
        /**
         * Generates information for a QR code frame based on a specific value to be encoded.
         *
         * @param {Frame~Options} options - the options to be used
         * @public
         * @class
         * @extends Nevis
         */
        var Frame = lite.extend(function(options) {
          var dataBlock, eccBlock, index, neccBlock1, neccBlock2;
          var valueLength = options.value.length;
      
          this._badness = [];
          this._level = ErrorCorrection_1.LEVELS[options.level];
          this._polynomial = [];
          this._value = options.value;
          this._version = 0;
          this._stringBuffer = [];
      
          while (this._version < 40) {
            this._version++;
      
            index = ((this._level - 1) * 4) + ((this._version - 1) * 16);
      
            neccBlock1 = ErrorCorrection_1.BLOCKS[index++];
            neccBlock2 = ErrorCorrection_1.BLOCKS[index++];
            dataBlock = ErrorCorrection_1.BLOCKS[index++];
            eccBlock = ErrorCorrection_1.BLOCKS[index];
      
            index = (dataBlock * (neccBlock1 + neccBlock2)) + neccBlock2 - 3 + (this._version <= 9);
      
            if (valueLength <= index) {
              break;
            }
          }
      
          this._dataBlock = dataBlock;
          this._eccBlock = eccBlock;
          this._neccBlock1 = neccBlock1;
          this._neccBlock2 = neccBlock2;
      
          /**
           * The data width is based on version.
           *
           * @public
           * @type {number}
           * @memberof Frame#
           */
          // FIXME: Ensure that it fits instead of being truncated.
          var width = this.width = 17 + (4 * this._version);
      
          /**
           * The image buffer.
           *
           * @public
           * @type {number[]}
           * @memberof Frame#
           */
          this.buffer = Frame._createArray(width * width);
      
          this._ecc = Frame._createArray(dataBlock + ((dataBlock + eccBlock) * (neccBlock1 + neccBlock2)) + neccBlock2);
          this._mask = Frame._createArray(((width * (width + 1)) + 1) / 2);
      
          this._insertFinders();
          this._insertAlignments();
      
          // Insert single foreground cell.
          this.buffer[8 + (width * (width - 8))] = 1;
      
          this._insertTimingGap();
          this._reverseMask();
          this._insertTimingRowAndColumn();
          this._insertVersion();
          this._syncMask();
          this._convertBitStream(valueLength);
          this._calculatePolynomial();
          this._appendEccToData();
          this._interleaveBlocks();
          this._pack();
          this._finish();
        }, {
      
          _addAlignment: function(x, y) {
            var i;
            var buffer = this.buffer;
            var width = this.width;
      
            buffer[x + (width * y)] = 1;
      
            for (i = -2; i < 2; i++) {
              buffer[x + i + (width * (y - 2))] = 1;
              buffer[x - 2 + (width * (y + i + 1))] = 1;
              buffer[x + 2 + (width * (y + i))] = 1;
              buffer[x + i + 1 + (width * (y + 2))] = 1;
            }
      
            for (i = 0; i < 2; i++) {
              this._setMask(x - 1, y + i);
              this._setMask(x + 1, y - i);
              this._setMask(x - i, y - 1);
              this._setMask(x + i, y + 1);
            }
          },
      
          _appendData: function(data, dataLength, ecc, eccLength) {
            var bit, i, j;
            var polynomial = this._polynomial;
            var stringBuffer = this._stringBuffer;
      
            for (i = 0; i < eccLength; i++) {
              stringBuffer[ecc + i] = 0;
            }
      
            for (i = 0; i < dataLength; i++) {
              bit = Galois_1.LOG[stringBuffer[data + i] ^ stringBuffer[ecc]];
      
              if (bit !== 255) {
                for (j = 1; j < eccLength; j++) {
                  stringBuffer[ecc + j - 1] = stringBuffer[ecc + j] ^
                    Galois_1.EXPONENT[Frame._modN(bit + polynomial[eccLength - j])];
                }
              } else {
                for (j = ecc; j < ecc + eccLength; j++) {
                  stringBuffer[j] = stringBuffer[j + 1];
                }
              }
      
              stringBuffer[ecc + eccLength - 1] = bit === 255 ? 0 : Galois_1.EXPONENT[Frame._modN(bit + polynomial[0])];
            }
          },
      
          _appendEccToData: function() {
            var i;
            var data = 0;
            var dataBlock = this._dataBlock;
            var ecc = this._calculateMaxLength();
            var eccBlock = this._eccBlock;
      
            for (i = 0; i < this._neccBlock1; i++) {
              this._appendData(data, dataBlock, ecc, eccBlock);
      
              data += dataBlock;
              ecc += eccBlock;
            }
      
            for (i = 0; i < this._neccBlock2; i++) {
              this._appendData(data, dataBlock + 1, ecc, eccBlock);
      
              data += dataBlock + 1;
              ecc += eccBlock;
            }
          },
      
          _applyMask: function(mask) {
            var r3x, r3y, x, y;
            var buffer = this.buffer;
            var width = this.width;
      
            switch (mask) {
            case 0:
              for (y = 0; y < width; y++) {
                for (x = 0; x < width; x++) {
                  if (!((x + y) & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 1:
              for (y = 0; y < width; y++) {
                for (x = 0; x < width; x++) {
                  if (!(y & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 2:
              for (y = 0; y < width; y++) {
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!r3x && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 3:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = r3y, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!r3x && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 4:
              for (y = 0; y < width; y++) {
                for (r3x = 0, r3y = (y >> 1) & 1, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                    r3y = !r3y;
                  }
      
                  if (!r3y && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 5:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!((x & y & 1) + !(!r3x | !r3y)) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 6:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!((x & y & 1) + (r3x && r3x === r3y) & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 7:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!((r3x && r3x === r3y) + (x + y & 1) & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            }
          },
      
          _calculateMaxLength: function() {
            return (this._dataBlock * (this._neccBlock1 + this._neccBlock2)) + this._neccBlock2;
          },
      
          _calculatePolynomial: function() {
            var i, j;
            var eccBlock = this._eccBlock;
            var polynomial = this._polynomial;
      
            polynomial[0] = 1;
      
            for (i = 0; i < eccBlock; i++) {
              polynomial[i + 1] = 1;
      
              for (j = i; j > 0; j--) {
                polynomial[j] = polynomial[j] ? polynomial[j - 1] ^
                  Galois_1.EXPONENT[Frame._modN(Galois_1.LOG[polynomial[j]] + i)] : polynomial[j - 1];
              }
      
              polynomial[0] = Galois_1.EXPONENT[Frame._modN(Galois_1.LOG[polynomial[0]] + i)];
            }
      
            // Use logs for generator polynomial to save calculation step.
            for (i = 0; i <= eccBlock; i++) {
              polynomial[i] = Galois_1.LOG[polynomial[i]];
            }
          },
      
          _checkBadness: function() {
            var b, b1, h, x, y;
            var bad = 0;
            var badness = this._badness;
            var buffer = this.buffer;
            var width = this.width;
      
            // Blocks of same colour.
            for (y = 0; y < width - 1; y++) {
              for (x = 0; x < width - 1; x++) {
                // All foreground colour.
                if ((buffer[x + (width * y)] &&
                  buffer[x + 1 + (width * y)] &&
                  buffer[x + (width * (y + 1))] &&
                  buffer[x + 1 + (width * (y + 1))]) ||
                  // All background colour.
                  !(buffer[x + (width * y)] ||
                  buffer[x + 1 + (width * y)] ||
                  buffer[x + (width * (y + 1))] ||
                  buffer[x + 1 + (width * (y + 1))])) {
                  bad += Frame.N2;
                }
              }
            }
      
            var bw = 0;
      
            // X runs.
            for (y = 0; y < width; y++) {
              h = 0;
      
              badness[0] = 0;
      
              for (b = 0, x = 0; x < width; x++) {
                b1 = buffer[x + (width * y)];
      
                if (b === b1) {
                  badness[h]++;
                } else {
                  badness[++h] = 1;
                }
      
                b = b1;
                bw += b ? 1 : -1;
              }
      
              bad += this._getBadness(h);
            }
      
            if (bw < 0) {
              bw = -bw;
            }
      
            var count = 0;
            var big = bw;
            big += big << 2;
            big <<= 1;
      
            while (big > width * width) {
              big -= width * width;
              count++;
            }
      
            bad += count * Frame.N4;
      
            // Y runs.
            for (x = 0; x < width; x++) {
              h = 0;
      
              badness[0] = 0;
      
              for (b = 0, y = 0; y < width; y++) {
                b1 = buffer[x + (width * y)];
      
                if (b === b1) {
                  badness[h]++;
                } else {
                  badness[++h] = 1;
                }
      
                b = b1;
              }
      
              bad += this._getBadness(h);
            }
      
            return bad;
          },
      
          _convertBitStream: function(length) {
            var bit, i;
            var ecc = this._ecc;
            var version = this._version;
      
            // Convert string to bit stream. 8-bit data to QR-coded 8-bit data (numeric, alphanumeric, or kanji not supported).
            for (i = 0; i < length; i++) {
              ecc[i] = this._value.charCodeAt(i);
            }
      
            var stringBuffer = this._stringBuffer = ecc.slice();
            var maxLength = this._calculateMaxLength();
      
            if (length >= maxLength - 2) {
              length = maxLength - 2;
      
              if (version > 9) {
                length--;
              }
            }
      
            // Shift and re-pack to insert length prefix.
            var index = length;
      
            if (version > 9) {
              stringBuffer[index + 2] = 0;
              stringBuffer[index + 3] = 0;
      
              while (index--) {
                bit = stringBuffer[index];
      
                stringBuffer[index + 3] |= 255 & (bit << 4);
                stringBuffer[index + 2] = bit >> 4;
              }
      
              stringBuffer[2] |= 255 & (length << 4);
              stringBuffer[1] = length >> 4;
              stringBuffer[0] = 0x40 | (length >> 12);
            } else {
              stringBuffer[index + 1] = 0;
              stringBuffer[index + 2] = 0;
      
              while (index--) {
                bit = stringBuffer[index];
      
                stringBuffer[index + 2] |= 255 & (bit << 4);
                stringBuffer[index + 1] = bit >> 4;
              }
      
              stringBuffer[1] |= 255 & (length << 4);
              stringBuffer[0] = 0x40 | (length >> 4);
            }
      
            // Fill to end with pad pattern.
            index = length + 3 - (version < 10);
      
            while (index < maxLength) {
              stringBuffer[index++] = 0xec;
              stringBuffer[index++] = 0x11;
            }
          },
      
          _getBadness: function(length) {
            var i;
            var badRuns = 0;
            var badness = this._badness;
      
            for (i = 0; i <= length; i++) {
              if (badness[i] >= 5) {
                badRuns += Frame.N1 + badness[i] - 5;
              }
            }
      
            // FBFFFBF as in finder.
            for (i = 3; i < length - 1; i += 2) {
              if (badness[i - 2] === badness[i + 2] &&
                badness[i + 2] === badness[i - 1] &&
                badness[i - 1] === badness[i + 1] &&
                badness[i - 1] * 3 === badness[i] &&
                // Background around the foreground pattern? Not part of the specs.
                (badness[i - 3] === 0 || i + 3 > length ||
                badness[i - 3] * 3 >= badness[i] * 4 ||
                badness[i + 3] * 3 >= badness[i] * 4)) {
                badRuns += Frame.N3;
              }
            }
      
            return badRuns;
          },
      
          _finish: function() {
            // Save pre-mask copy of frame.
            this._stringBuffer = this.buffer.slice();
      
            var currentMask, i;
            var bit = 0;
            var mask = 30000;
      
            /*
             * Using for instead of while since in original Arduino code if an early mask was "good enough" it wouldn't try for
             * a better one since they get more complex and take longer.
             */
            for (i = 0; i < 8; i++) {
              // Returns foreground-background imbalance.
              this._applyMask(i);
      
              currentMask = this._checkBadness();
      
              // Is current mask better than previous best?
              if (currentMask < mask) {
                mask = currentMask;
                bit = i;
              }
      
              // Don't increment "i" to a void redoing mask.
              if (bit === 7) {
                break;
              }
      
              // Reset for next pass.
              this.buffer = this._stringBuffer.slice();
            }
      
            // Redo best mask as none were "good enough" (i.e. last wasn't bit).
            if (bit !== i) {
              this._applyMask(bit);
            }
      
            // Add in final mask/ECC level bytes.
            mask = ErrorCorrection_1.FINAL_FORMAT[bit + (this._level - 1 << 3)];
      
            var buffer = this.buffer;
            var width = this.width;
      
            // Low byte.
            for (i = 0; i < 8; i++, mask >>= 1) {
              if (mask & 1) {
                buffer[width - 1 - i + (width * 8)] = 1;
      
                if (i < 6) {
                  buffer[8 + (width * i)] = 1;
                } else {
                  buffer[8 + (width * (i + 1))] = 1;
                }
              }
            }
      
            // High byte.
            for (i = 0; i < 7; i++, mask >>= 1) {
              if (mask & 1) {
                buffer[8 + (width * (width - 7 + i))] = 1;
      
                if (i) {
                  buffer[6 - i + (width * 8)] = 1;
                } else {
                  buffer[7 + (width * 8)] = 1;
                }
              }
            }
          },
      
          _interleaveBlocks: function() {
            var i, j;
            var dataBlock = this._dataBlock;
            var ecc = this._ecc;
            var eccBlock = this._eccBlock;
            var k = 0;
            var maxLength = this._calculateMaxLength();
            var neccBlock1 = this._neccBlock1;
            var neccBlock2 = this._neccBlock2;
            var stringBuffer = this._stringBuffer;
      
            for (i = 0; i < dataBlock; i++) {
              for (j = 0; j < neccBlock1; j++) {
                ecc[k++] = stringBuffer[i + (j * dataBlock)];
              }
      
              for (j = 0; j < neccBlock2; j++) {
                ecc[k++] = stringBuffer[(neccBlock1 * dataBlock) + i + (j * (dataBlock + 1))];
              }
            }
      
            for (j = 0; j < neccBlock2; j++) {
              ecc[k++] = stringBuffer[(neccBlock1 * dataBlock) + i + (j * (dataBlock + 1))];
            }
      
            for (i = 0; i < eccBlock; i++) {
              for (j = 0; j < neccBlock1 + neccBlock2; j++) {
                ecc[k++] = stringBuffer[maxLength + i + (j * eccBlock)];
              }
            }
      
            this._stringBuffer = ecc;
          },
      
          _insertAlignments: function() {
            var i, x, y;
            var version = this._version;
            var width = this.width;
      
            if (version > 1) {
              i = Alignment_1.BLOCK[version];
              y = width - 7;
      
              for (;;) {
                x = width - 7;
      
                while (x > i - 3) {
                  this._addAlignment(x, y);
      
                  if (x < i) {
                    break;
                  }
      
                  x -= i;
                }
      
                if (y <= i + 9) {
                  break;
                }
      
                y -= i;
      
                this._addAlignment(6, y);
                this._addAlignment(y, 6);
              }
            }
          },
      
          _insertFinders: function() {
            var i, j, x, y;
            var buffer = this.buffer;
            var width = this.width;
      
            for (i = 0; i < 3; i++) {
              j = 0;
              y = 0;
      
              if (i === 1) {
                j = width - 7;
              }
              if (i === 2) {
                y = width - 7;
              }
      
              buffer[y + 3 + (width * (j + 3))] = 1;
      
              for (x = 0; x < 6; x++) {
                buffer[y + x + (width * j)] = 1;
                buffer[y + (width * (j + x + 1))] = 1;
                buffer[y + 6 + (width * (j + x))] = 1;
                buffer[y + x + 1 + (width * (j + 6))] = 1;
              }
      
              for (x = 1; x < 5; x++) {
                this._setMask(y + x, j + 1);
                this._setMask(y + 1, j + x + 1);
                this._setMask(y + 5, j + x);
                this._setMask(y + x + 1, j + 5);
              }
      
              for (x = 2; x < 4; x++) {
                buffer[y + x + (width * (j + 2))] = 1;
                buffer[y + 2 + (width * (j + x + 1))] = 1;
                buffer[y + 4 + (width * (j + x))] = 1;
                buffer[y + x + 1 + (width * (j + 4))] = 1;
              }
            }
          },
      
          _insertTimingGap: function() {
            var x, y;
            var width = this.width;
      
            for (y = 0; y < 7; y++) {
              this._setMask(7, y);
              this._setMask(width - 8, y);
              this._setMask(7, y + width - 7);
            }
      
            for (x = 0; x < 8; x++) {
              this._setMask(x, 7);
              this._setMask(x + width - 8, 7);
              this._setMask(x, width - 8);
            }
          },
      
          _insertTimingRowAndColumn: function() {
            var x;
            var buffer = this.buffer;
            var width = this.width;
      
            for (x = 0; x < width - 14; x++) {
              if (x & 1) {
                this._setMask(8 + x, 6);
                this._setMask(6, 8 + x);
              } else {
                buffer[8 + x + (width * 6)] = 1;
                buffer[6 + (width * (8 + x))] = 1;
              }
            }
          },
      
          _insertVersion: function() {
            var i, j, x, y;
            var buffer = this.buffer;
            var version = this._version;
            var width = this.width;
      
            if (version > 6) {
              i = Version_1.BLOCK[version - 7];
              j = 17;
      
              for (x = 0; x < 6; x++) {
                for (y = 0; y < 3; y++, j--) {
                  if (1 & (j > 11 ? version >> j - 12 : i >> j)) {
                    buffer[5 - x + (width * (2 - y + width - 11))] = 1;
                    buffer[2 - y + width - 11 + (width * (5 - x))] = 1;
                  } else {
                    this._setMask(5 - x, 2 - y + width - 11);
                    this._setMask(2 - y + width - 11, 5 - x);
                  }
                }
              }
            }
          },
      
          _isMasked: function(x, y) {
            var bit = Frame._getMaskBit(x, y);
      
            return this._mask[bit] === 1;
          },
      
          _pack: function() {
            var bit, i, j;
            var k = 1;
            var v = 1;
            var width = this.width;
            var x = width - 1;
            var y = width - 1;
      
            // Interleaved data and ECC codes.
            var length = ((this._dataBlock + this._eccBlock) * (this._neccBlock1 + this._neccBlock2)) + this._neccBlock2;
      
            for (i = 0; i < length; i++) {
              bit = this._stringBuffer[i];
      
              for (j = 0; j < 8; j++, bit <<= 1) {
                if (0x80 & bit) {
                  this.buffer[x + (width * y)] = 1;
                }
      
                // Find next fill position.
                do {
                  if (v) {
                    x--;
                  } else {
                    x++;
      
                    if (k) {
                      if (y !== 0) {
                        y--;
                      } else {
                        x -= 2;
                        k = !k;
      
                        if (x === 6) {
                          x--;
                          y = 9;
                        }
                      }
                    } else if (y !== width - 1) {
                      y++;
                    } else {
                      x -= 2;
                      k = !k;
      
                      if (x === 6) {
                        x--;
                        y -= 8;
                      }
                    }
                  }
      
                  v = !v;
                } while (this._isMasked(x, y));
              }
            }
          },
      
          _reverseMask: function() {
            var x, y;
            var width = this.width;
      
            for (x = 0; x < 9; x++) {
              this._setMask(x, 8);
            }
      
            for (x = 0; x < 8; x++) {
              this._setMask(x + width - 8, 8);
              this._setMask(8, x);
            }
      
            for (y = 0; y < 7; y++) {
              this._setMask(8, y + width - 7);
            }
          },
      
          _setMask: function(x, y) {
            var bit = Frame._getMaskBit(x, y);
      
            this._mask[bit] = 1;
          },
      
          _syncMask: function() {
            var x, y;
            var width = this.width;
      
            for (y = 0; y < width; y++) {
              for (x = 0; x <= y; x++) {
                if (this.buffer[x + (width * y)]) {
                  this._setMask(x, y);
                }
              }
            }
          }
      
        }, {
      
          _createArray: function(length) {
            var i;
            var array = [];
      
            for (i = 0; i < length; i++) {
              array[i] = 0;
            }
      
            return array;
          },
      
          _getMaskBit: function(x, y) {
            var bit;
      
            if (x > y) {
              bit = x;
              x = y;
              y = bit;
            }
      
            bit = y;
            bit += y * y;
            bit >>= 1;
            bit += x;
      
            return bit;
          },
      
          _modN: function(x) {
            while (x >= 255) {
              x -= 255;
              x = (x >> 8) + (x & 255);
            }
      
            return x;
          },
      
          // *Badness* coefficients.
          N1: 3,
          N2: 3,
          N3: 40,
          N4: 10
      
        });
      
        var Frame_1 = Frame;
      
        /**
         * The options used by {@link Frame}.
         *
         * @typedef {Object} Frame~Options
         * @property {string} level - The ECC level to be used.
         * @property {string} value - The value to be encoded.
         */
      
        /**
         * An implementation of {@link Renderer} for working with <code>img</code> elements.
         *
         * This depends on {@link CanvasRenderer} being executed first as this implementation simply applies the data URL from
         * the rendered <code>canvas</code> element as the <code>src</code> for the <code>img</code> element being rendered.
         *
         * @public
         * @class
         * @extends Renderer
         */
        var ImageRenderer = Renderer_1.extend({
      
          /**
           * @override
           */
          draw: function() {
            this.element.src = this.qrious.toDataURL();
          },
      
          /**
           * @override
           */
          reset: function() {
            this.element.src = '';
          },
      
          /**
           * @override
           */
          resize: function() {
            var element = this.element;
      
            element.width = element.height = this.qrious.size;
          }
      
        });
      
        var ImageRenderer_1 = ImageRenderer;
      
        /**
         * Defines an available option while also configuring how values are applied to the target object.
         *
         * Optionally, a default value can be specified as well a value transformer for greater control over how the option
         * value is applied.
         *
         * If no value transformer is specified, then any specified option will be applied directly. All values are maintained
         * on the target object itself as a field using the option name prefixed with a single underscore.
         *
         * When an option is specified as modifiable, the {@link OptionManager} will be required to include a setter for the
         * property that is defined on the target object that uses the option name.
         *
         * @param {string} name - the name to be used
         * @param {boolean} [modifiable] - <code>true</code> if the property defined on target objects should include a setter;
         * otherwise <code>false</code>
         * @param {*} [defaultValue] - the default value to be used
         * @param {Option~ValueTransformer} [valueTransformer] - the value transformer to be used
         * @public
         * @class
         * @extends Nevis
         */
        var Option = lite.extend(function(name, modifiable, defaultValue, valueTransformer) {
          /**
           * The name for this {@link Option}.
           *
           * @public
           * @type {string}
           * @memberof Option#
           */
          this.name = name;
      
          /**
           * Whether a setter should be included on the property defined on target objects for this {@link Option}.
           *
           * @public
           * @type {boolean}
           * @memberof Option#
           */
          this.modifiable = Boolean(modifiable);
      
          /**
           * The default value for this {@link Option}.
           *
           * @public
           * @type {*}
           * @memberof Option#
           */
          this.defaultValue = defaultValue;
      
          this._valueTransformer = valueTransformer;
        }, {
      
          /**
           * Transforms the specified <code>value</code> so that it can be applied for this {@link Option}.
           *
           * If a value transformer has been specified for this {@link Option}, it will be called upon to transform
           * <code>value</code>. Otherwise, <code>value</code> will be returned directly.
           *
           * @param {*} value - the value to be transformed
           * @return {*} The transformed value or <code>value</code> if no value transformer is specified.
           * @public
           * @memberof Option#
           */
          transform: function(value) {
            var transformer = this._valueTransformer;
            if (typeof transformer === 'function') {
              return transformer(value, this);
            }
      
            return value;
          }
      
        });
      
        var Option_1 = Option;
      
        /**
         * Returns a transformed value for the specified <code>value</code> to be applied for the <code>option</code> provided.
         *
         * @callback Option~ValueTransformer
         * @param {*} value - the value to be transformed
         * @param {Option} option - the {@link Option} for which <code>value</code> is being transformed
         * @return {*} The transform value.
         */
      
        /**
         * Contains utility methods that are useful throughout the library.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Utilities = lite.extend(null, {
      
          /**
           * Returns the absolute value of a given number.
           *
           * This method is simply a convenient shorthand for <code>Math.abs</code> while ensuring that nulls are returned as
           * <code>null</code> instead of zero.
           *
           * @param {number} value - the number whose absolute value is to be returned
           * @return {number} The absolute value of <code>value</code> or <code>null</code> if <code>value</code> is
           * <code>null</code>.
           * @public
           * @static
           * @memberof Utilities
           */
          abs: function(value) {
            return value != null ? Math.abs(value) : null;
          },
      
          /**
           * Returns whether the specified <code>object</code> has a property with the specified <code>name</code> as an own
           * (not inherited) property.
           *
           * @param {Object} object - the object on which the property is to be checked
           * @param {string} name - the name of the property to be checked
           * @return {boolean} <code>true</code> if <code>object</code> has an own property with <code>name</code>.
           * @public
           * @static
           * @memberof Utilities
           */
          hasOwn: function(object, name) {
            return Object.prototype.hasOwnProperty.call(object, name);
          },
      
          /**
           * A non-operation method that does absolutely nothing.
           *
           * @return {void}
           * @public
           * @static
           * @memberof Utilities
           */
          noop: function() {},
      
          /**
           * Transforms the specified <code>string</code> to upper case while remaining null-safe.
           *
           * @param {string} string - the string to be transformed to upper case
           * @return {string} <code>string</code> transformed to upper case if <code>string</code> is not <code>null</code>.
           * @public
           * @static
           * @memberof Utilities
           */
          toUpperCase: function(string) {
            return string != null ? string.toUpperCase() : null;
          }
      
        });
      
        var Utilities_1 = Utilities;
      
        /**
         * Manages multiple {@link Option} instances that are intended to be used by multiple implementations.
         *
         * Although the option definitions are shared between targets, the values are maintained on the targets themselves.
         *
         * @param {Option[]} options - the options to be used
         * @public
         * @class
         * @extends Nevis
         */
        var OptionManager = lite.extend(function(options) {
          /**
           * The available options for this {@link OptionManager}.
           *
           * @public
           * @type {Object.<string, Option>}
           * @memberof OptionManager#
           */
          this.options = {};
      
          options.forEach(function(option) {
            this.options[option.name] = option;
          }, this);
        }, {
      
          /**
           * Returns whether an option with the specified <code>name</code> is available.
           *
           * @param {string} name - the name of the {@link Option} whose existence is to be checked
           * @return {boolean} <code>true</code> if an {@link Option} exists with <code>name</code>; otherwise
           * <code>false</code>.
           * @public
           * @memberof OptionManager#
           */
          exists: function(name) {
            return this.options[name] != null;
          },
      
          /**
           * Returns the value of the option with the specified <code>name</code> on the <code>target</code> object provided.
           *
           * @param {string} name - the name of the {@link Option} whose value on <code>target</code> is to be returned
           * @param {Object} target - the object from which the value of the named {@link Option} is to be returned
           * @return {*} The value of the {@link Option} with <code>name</code> on <code>target</code>.
           * @public
           * @memberof OptionManager#
           */
          get: function(name, target) {
            return OptionManager._get(this.options[name], target);
          },
      
          /**
           * Returns a copy of all of the available options on the <code>target</code> object provided.
           *
           * @param {Object} target - the object from which the option name/value pairs are to be returned
           * @return {Object.<string, *>} A hash containing the name/value pairs of all options on <code>target</code>.
           * @public
           * @memberof OptionManager#
           */
          getAll: function(target) {
            var name;
            var options = this.options;
            var result = {};
      
            for (name in options) {
              if (Utilities_1.hasOwn(options, name)) {
                result[name] = OptionManager._get(options[name], target);
              }
            }
      
            return result;
          },
      
          /**
           * Initializes the available options for the <code>target</code> object provided and then applies the initial values
           * within the speciifed <code>options</code>.
           *
           * This method will throw an error if any of the names within <code>options</code> does not match an available option.
           *
           * This involves setting the default values and defining properties for all of the available options on
           * <code>target</code> before finally calling {@link OptionMananger#setAll} with <code>options</code> and
           * <code>target</code>. Any options that are configured to be modifiable will have a setter included in their defined
           * property that will allow its corresponding value to be modified.
           *
           * If a change handler is specified, it will be called whenever the value changes on <code>target</code> for a
           * modifiable option, but only when done so via the defined property's setter.
           *
           * @param {Object.<string, *>} options - the name/value pairs of the initial options to be set
           * @param {Object} target - the object on which the options are to be initialized
           * @param {Function} [changeHandler] - the function to be called whenever the value of an modifiable option changes on
           * <code>target</code>
           * @return {void}
           * @throws {Error} If <code>options</code> contains an invalid option name.
           * @public
           * @memberof OptionManager#
           */
          init: function(options, target, changeHandler) {
            if (typeof changeHandler !== 'function') {
              changeHandler = Utilities_1.noop;
            }
      
            var name, option;
      
            for (name in this.options) {
              if (Utilities_1.hasOwn(this.options, name)) {
                option = this.options[name];
      
                OptionManager._set(option, option.defaultValue, target);
                OptionManager._createAccessor(option, target, changeHandler);
              }
            }
      
            this._setAll(options, target, true);
          },
      
          /**
           * Sets the value of the option with the specified <code>name</code> on the <code>target</code> object provided to
           * <code>value</code>.
           *
           * This method will throw an error if <code>name</code> does not match an available option or matches an option that
           * cannot be modified.
           *
           * If <code>value</code> is <code>null</code> and the {@link Option} has a default value configured, then that default
           * value will be used instead. If the {@link Option} also has a value transformer configured, it will be used to
           * transform whichever value was determined to be used.
           *
           * This method returns whether the value of the underlying field on <code>target</code> was changed as a result.
           *
           * @param {string} name - the name of the {@link Option} whose value is to be set
           * @param {*} value - the value to be set for the named {@link Option} on <code>target</code>
           * @param {Object} target - the object on which <code>value</code> is to be set for the named {@link Option}
           * @return {boolean} <code>true</code> if the underlying field on <code>target</code> was changed; otherwise
           * <code>false</code>.
           * @throws {Error} If <code>name</code> is invalid or is for an option that cannot be modified.
           * @public
           * @memberof OptionManager#
           */
          set: function(name, value, target) {
            return this._set(name, value, target);
          },
      
          /**
           * Sets all of the specified <code>options</code> on the <code>target</code> object provided to their corresponding
           * values.
           *
           * This method will throw an error if any of the names within <code>options</code> does not match an available option
           * or matches an option that cannot be modified.
           *
           * If any value within <code>options</code> is <code>null</code> and the corresponding {@link Option} has a default
           * value configured, then that default value will be used instead. If an {@link Option} also has a value transformer
           * configured, it will be used to transform whichever value was determined to be used.
           *
           * This method returns whether the value for any of the underlying fields on <code>target</code> were changed as a
           * result.
           *
           * @param {Object.<string, *>} options - the name/value pairs of options to be set
           * @param {Object} target - the object on which the options are to be set
           * @return {boolean} <code>true</code> if any of the underlying fields on <code>target</code> were changed; otherwise
           * <code>false</code>.
           * @throws {Error} If <code>options</code> contains an invalid option name or an option that cannot be modiifed.
           * @public
           * @memberof OptionManager#
           */
          setAll: function(options, target) {
            return this._setAll(options, target);
          },
      
          _set: function(name, value, target, allowUnmodifiable) {
            var option = this.options[name];
            if (!option) {
              throw new Error('Invalid option: ' + name);
            }
            if (!option.modifiable && !allowUnmodifiable) {
              throw new Error('Option cannot be modified: ' + name);
            }
      
            return OptionManager._set(option, value, target);
          },
      
          _setAll: function(options, target, allowUnmodifiable) {
            if (!options) {
              return false;
            }
      
            var name;
            var changed = false;
      
            for (name in options) {
              if (Utilities_1.hasOwn(options, name) && this._set(name, options[name], target, allowUnmodifiable)) {
                changed = true;
              }
            }
      
            return changed;
          }
      
        }, {
      
          _createAccessor: function(option, target, changeHandler) {
            var descriptor = {
              get: function() {
                return OptionManager._get(option, target);
              }
            };
      
            if (option.modifiable) {
              descriptor.set = function(value) {
                if (OptionManager._set(option, value, target)) {
                  changeHandler(value, option);
                }
              };
            }
      
            Object.defineProperty(target, option.name, descriptor);
          },
      
          _get: function(option, target) {
            return target['_' + option.name];
          },
      
          _set: function(option, value, target) {
            var fieldName = '_' + option.name;
            var oldValue = target[fieldName];
            var newValue = option.transform(value != null ? value : option.defaultValue);
      
            target[fieldName] = newValue;
      
            return newValue !== oldValue;
          }
      
        });
      
        var OptionManager_1 = OptionManager;
      
        /**
         * Called whenever the value of a modifiable {@link Option} is changed on a target object via the defined property's
         * setter.
         *
         * @callback OptionManager~ChangeHandler
         * @param {*} value - the new value for <code>option</code> on the target object
         * @param {Option} option - the modifable {@link Option} whose value has changed on the target object.
         * @return {void}
         */
      
        /**
         * A basic manager for {@link Service} implementations that are mapped to simple names.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var ServiceManager = lite.extend(function() {
          this._services = {};
        }, {
      
          /**
           * Returns the {@link Service} being managed with the specified <code>name</code>.
           *
           * @param {string} name - the name of the {@link Service} to be returned
           * @return {Service} The {@link Service} is being managed with <code>name</code>.
           * @throws {Error} If no {@link Service} is being managed with <code>name</code>.
           * @public
           * @memberof ServiceManager#
           */
          getService: function(name) {
            var service = this._services[name];
            if (!service) {
              throw new Error('Service is not being managed with name: ' + name);
            }
      
            return service;
          },
      
          /**
           * Sets the {@link Service} implementation to be managed for the specified <code>name</code> to the
           * <code>service</code> provided.
           *
           * @param {string} name - the name of the {@link Service} to be managed with <code>name</code>
           * @param {Service} service - the {@link Service} implementation to be managed
           * @return {void}
           * @throws {Error} If a {@link Service} is already being managed with the same <code>name</code>.
           * @public
           * @memberof ServiceManager#
           */
          setService: function(name, service) {
            if (this._services[name]) {
              throw new Error('Service is already managed with name: ' + name);
            }
      
            if (service) {
              this._services[name] = service;
            }
          }
      
        });
      
        var ServiceManager_1 = ServiceManager;
      
        var optionManager = new OptionManager_1([
          new Option_1('background', true, 'white'),
          new Option_1('backgroundAlpha', true, 1, Utilities_1.abs),
          new Option_1('element'),
          new Option_1('foreground', true, 'black'),
          new Option_1('foregroundAlpha', true, 1, Utilities_1.abs),
          new Option_1('level', true, 'L', Utilities_1.toUpperCase),
          new Option_1('mime', true, 'image/png'),
          new Option_1('padding', true, null, Utilities_1.abs),
          new Option_1('size', true, 100, Utilities_1.abs),
          new Option_1('value', true, '')
        ]);
        var serviceManager = new ServiceManager_1();
      
        /**
         * Enables configuration of a QR code generator which uses HTML5 <code>canvas</code> for rendering.
         *
         * @param {QRious~Options} [options] - the options to be used
         * @throws {Error} If any <code>options</code> are invalid.
         * @public
         * @class
         * @extends Nevis
         */
        var QRious = lite.extend(function(options) {
          optionManager.init(options, this, this.update.bind(this));
      
          var element = optionManager.get('element', this);
          var elementService = serviceManager.getService('element');
          var canvas = element && elementService.isCanvas(element) ? element : elementService.createCanvas();
          var image = element && elementService.isImage(element) ? element : elementService.createImage();
      
          this._canvasRenderer = new CanvasRenderer_1(this, canvas, true);
          this._imageRenderer = new ImageRenderer_1(this, image, image === element);
      
          this.update();
        }, {
      
          /**
           * Returns all of the options configured for this {@link QRious}.
           *
           * Any changes made to the returned object will not be reflected in the options themselves or their corresponding
           * underlying fields.
           *
           * @return {Object.<string, *>} A copy of the applied options.
           * @public
           * @memberof QRious#
           */
          get: function() {
            return optionManager.getAll(this);
          },
      
          /**
           * Sets all of the specified <code>options</code> and automatically updates this {@link QRious} if any of the
           * underlying fields are changed as a result.
           *
           * This is the preferred method for updating multiple options at one time to avoid unnecessary updates between
           * changes.
           *
           * @param {QRious~Options} options - the options to be set
           * @return {void}
           * @throws {Error} If any <code>options</code> are invalid or cannot be modified.
           * @public
           * @memberof QRious#
           */
          set: function(options) {
            if (optionManager.setAll(options, this)) {
              this.update();
            }
          },
      
          /**
           * Returns the image data URI for the generated QR code using the <code>mime</code> provided.
           *
           * @param {string} [mime] - the MIME type for the image
           * @return {string} The image data URI for the QR code.
           * @public
           * @memberof QRious#
           */
          toDataURL: function(mime) {
            return this.canvas.toDataURL(mime || this.mime);
          },
      
          /**
           * Updates this {@link QRious} by generating a new {@link Frame} and re-rendering the QR code.
           *
           * @return {void}
           * @protected
           * @memberof QRious#
           */
          update: function() {
            var frame = new Frame_1({
              level: this.level,
              value: this.value
            });
      
            this._canvasRenderer.render(frame);
            this._imageRenderer.render(frame);
          }
      
        }, {
      
          /**
           * Configures the <code>service</code> provided to be used by all {@link QRious} instances.
           *
           * @param {Service} service - the {@link Service} to be configured
           * @return {void}
           * @throws {Error} If a {@link Service} has already been configured with the same name.
           * @public
           * @static
           * @memberof QRious
           */
          use: function(service) {
            serviceManager.setService(service.getName(), service);
          }
      
        });
      
        Object.defineProperties(QRious.prototype, {
      
          canvas: {
            /**
             * Returns the <code>canvas</code> element being used to render the QR code for this {@link QRious}.
             *
             * @return {*} The <code>canvas</code> element.
             * @public
             * @memberof QRious#
             * @alias canvas
             */
            get: function() {
              return this._canvasRenderer.getElement();
            }
          },
      
          image: {
            /**
             * Returns the <code>img</code> element being used to render the QR code for this {@link QRious}.
             *
             * @return {*} The <code>img</code> element.
             * @public
             * @memberof QRious#
             * @alias image
             */
            get: function() {
              return this._imageRenderer.getElement();
            }
          }
      
        });
      
        var QRious_1$2 = QRious;
      
        /**
         * The options used by {@link QRious}.
         *
         * @typedef {Object} QRious~Options
         * @property {string} [background="white"] - The background color to be applied to the QR code.
         * @property {number} [backgroundAlpha=1] - The background alpha to be applied to the QR code.
         * @property {*} [element] - The element to be used to render the QR code which may either be an <code>canvas</code> or
         * <code>img</code>. The element(s) will be created if needed.
         * @property {string} [foreground="black"] - The foreground color to be applied to the QR code.
         * @property {number} [foregroundAlpha=1] - The foreground alpha to be applied to the QR code.
         * @property {string} [level="L"] - The error correction level to be applied to the QR code.
         * @property {string} [mime="image/png"] - The MIME type to be used to render the image for the QR code.
         * @property {number} [padding] - The padding for the QR code in pixels.
         * @property {number} [size=100] - The size of the QR code in pixels.
         * @property {string} [value=""] - The value to be encoded within the QR code.
         */
      
        var index = QRious_1$2;
      
        /**
         * Defines a service contract that must be met by all implementations.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Service = lite.extend({
      
          /**
           * Returns the name of this {@link Service}.
           *
           * @return {string} The service name.
           * @public
           * @abstract
           * @memberof Service#
           */
          getName: function() {}
      
        });
      
        var Service_1 = Service;
      
        /**
         * A service for working with elements.
         *
         * @public
         * @class
         * @extends Service
         */
        var ElementService = Service_1.extend({
      
          /**
           * Creates an instance of a canvas element.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @return {*} The newly created canvas element.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          createCanvas: function() {},
      
          /**
           * Creates an instance of a image element.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @return {*} The newly created image element.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          createImage: function() {},
      
          /**
           * @override
           */
          getName: function() {
            return 'element';
          },
      
          /**
           * Returns whether the specified <code>element</code> is a canvas.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @param {*} element - the element to be checked
           * @return {boolean} <code>true</code> if <code>element</code> is a canvas; otherwise <code>false</code>.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          isCanvas: function(element) {},
      
          /**
           * Returns whether the specified <code>element</code> is an image.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @param {*} element - the element to be checked
           * @return {boolean} <code>true</code> if <code>element</code> is an image; otherwise <code>false</code>.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          isImage: function(element) {}
      
        });
      
        var ElementService_1 = ElementService;
      
        /**
         * An implementation of {@link ElementService} intended for use within a browser environment.
         *
         * @public
         * @class
         * @extends ElementService
         */
        var BrowserElementService = ElementService_1.extend({
      
          /**
           * @override
           */
          createCanvas: function() {
            return document.createElement('canvas');
          },
      
          /**
           * @override
           */
          createImage: function() {
            return document.createElement('img');
          },
      
          /**
           * @override
           */
          isCanvas: function(element) {
            return element instanceof HTMLCanvasElement;
          },
      
          /**
           * @override
           */
          isImage: function(element) {
            return element instanceof HTMLImageElement;
          }
      
        });
      
        var BrowserElementService_1 = BrowserElementService;
      
        index.use(new BrowserElementService_1());
      
        var QRious_1 = index;
      
        return QRious_1;
      
      })));
    });

    /* node_modules\svelte-qrcode\src\lib\index.svelte generated by Svelte v3.55.1 */
    const file$1 = "node_modules\\svelte-qrcode\\src\\lib\\index.svelte";

    function create_fragment$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*value*/ ctx[0]);
    			attr_dev(img, "class", /*className*/ ctx[1]);
    			add_location(img, file$1, 41, 0, 681);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 4 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*value*/ 1) {
    				attr_dev(img, "alt", /*value*/ ctx[0]);
    			}

    			if (dirty & /*className*/ 2) {
    				attr_dev(img, "class", /*className*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Lib', slots, []);
    	const QRcode = new qrcode();
    	let { errorCorrection = "L" } = $$props;
    	let { background = "#fff" } = $$props;
    	let { color = "#000" } = $$props;
    	let { size = "200" } = $$props;
    	let { value = "" } = $$props;
    	let { padding = 0 } = $$props;
    	let { className = "qrcode" } = $$props;
    	let image = '';

    	function generateQrCode() {
    		QRcode.set({
    			background,
    			foreground: color,
    			level: errorCorrection,
    			padding,
    			size,
    			value
    		});

    		$$invalidate(2, image = QRcode.toDataURL('image/jpeg'));
    	}

    	onMount(() => {
    		generateQrCode();
    	});

    	const writable_props = [
    		'errorCorrection',
    		'background',
    		'color',
    		'size',
    		'value',
    		'padding',
    		'className'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lib> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('errorCorrection' in $$props) $$invalidate(3, errorCorrection = $$props.errorCorrection);
    		if ('background' in $$props) $$invalidate(4, background = $$props.background);
    		if ('color' in $$props) $$invalidate(5, color = $$props.color);
    		if ('size' in $$props) $$invalidate(6, size = $$props.size);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('padding' in $$props) $$invalidate(7, padding = $$props.padding);
    		if ('className' in $$props) $$invalidate(1, className = $$props.className);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		QrCode: qrcode,
    		QRcode,
    		errorCorrection,
    		background,
    		color,
    		size,
    		value,
    		padding,
    		className,
    		image,
    		generateQrCode
    	});

    	$$self.$inject_state = $$props => {
    		if ('errorCorrection' in $$props) $$invalidate(3, errorCorrection = $$props.errorCorrection);
    		if ('background' in $$props) $$invalidate(4, background = $$props.background);
    		if ('color' in $$props) $$invalidate(5, color = $$props.color);
    		if ('size' in $$props) $$invalidate(6, size = $$props.size);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('padding' in $$props) $$invalidate(7, padding = $$props.padding);
    		if ('className' in $$props) $$invalidate(1, className = $$props.className);
    		if ('image' in $$props) $$invalidate(2, image = $$props.image);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			{
    				if (value) {
    					generateQrCode();
    				}
    			}
    		}
    	};

    	return [value, className, image, errorCorrection, background, color, size, padding];
    }

    class Lib extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			errorCorrection: 3,
    			background: 4,
    			color: 5,
    			size: 6,
    			value: 0,
    			padding: 7,
    			className: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lib",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get errorCorrection() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errorCorrection(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\QRPage.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1, console: console_1 } = globals;

    const file = "src\\QRPage.svelte";

    // (30:0) {#if show}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let svg;
    	let path;
    	let t0;
    	let span;
    	let div1_intro;
    	let div1_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span = element("span");
    			span.textContent = "Copied CSV to Clipboard";
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z");
    			add_location(path, file, 32, 125, 1071);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "class", "stroke-current flex-shrink-0 w-6 h-6");
    			add_location(svg, file, 32, 8, 954);
    			add_location(span, file, 33, 8, 1226);
    			add_location(div0, file, 31, 4, 939);
    			attr_dev(div1, "class", "alert alert-info shadow-lg absolute");
    			add_location(div1, file, 30, 0, 867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div0, t0);
    			append_dev(div0, span);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, {});
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(30:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t0;
    	let div0;
    	let qrcode;
    	let t1;
    	let div1;
    	let gamepiececombo;
    	let current;
    	let if_block = /*show*/ ctx[0] && create_if_block$1(ctx);

    	qrcode = new Lib({
    			props: {
    				color: "#006daa",
    				size: "800",
    				background: "#14110F",
    				errorCorrection: "Q",
    				value: /*qrString*/ ctx[1]
    			},
    			$$inline: true
    		});

    	gamepiececombo = new GamePieceCombo({
    			props: { type: "qr", class: "mx-auto" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			create_component(qrcode.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(gamepiececombo.$$.fragment);
    			attr_dev(div0, "class", "w-full flex items-center justify-center h-screen w-screen");
    			add_location(div0, file, 38, 0, 1293);
    			attr_dev(div1, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div1, file, 44, 0, 1483);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(qrcode, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(gamepiececombo, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*show*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(qrcode.$$.fragment, local);
    			transition_in(gamepiececombo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(qrcode.$$.fragment, local);
    			transition_out(gamepiececombo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_component(qrcode);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(gamepiececombo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $postGameData;
    	let $teleGameData;
    	let $autoGameData;
    	let $generalGameData;
    	validate_store(postGameData, 'postGameData');
    	component_subscribe($$self, postGameData, $$value => $$invalidate(2, $postGameData = $$value));
    	validate_store(teleGameData, 'teleGameData');
    	component_subscribe($$self, teleGameData, $$value => $$invalidate(3, $teleGameData = $$value));
    	validate_store(autoGameData, 'autoGameData');
    	component_subscribe($$self, autoGameData, $$value => $$invalidate(4, $autoGameData = $$value));
    	validate_store(generalGameData, 'generalGameData');
    	component_subscribe($$self, generalGameData, $$value => $$invalidate(5, $generalGameData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QRPage', slots, []);
    	let show = true;

    	if ($autoGameData["startingLocation"] === "Select Starting Location") {
    		set_store_value(autoGameData, $autoGameData["startingLocation"] = "None", $autoGameData);
    	}

    	let qrString = `${Object.values($generalGameData).join(',') + "," + Object.values($autoGameData).join(',') + "," + Object.values($teleGameData).join(',') + "," + Object.values($postGameData).join(',')}`;
    	console.log(qrString);

    	setTimeout(
    		() => {
    			$$invalidate(0, show = false);
    		},
    		1500
    	);

    	if (!navigator.clipboard) {
    		document.execCommand('copy');
    	} else {
    		navigator.clipboard.writeText(qrString);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<QRPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		QrCode: Lib,
    		GamePieceCombo,
    		autoGameData,
    		generalGameData,
    		postGameData,
    		teleGameData,
    		show,
    		qrString,
    		$postGameData,
    		$teleGameData,
    		$autoGameData,
    		$generalGameData
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(0, show = $$props.show);
    		if ('qrString' in $$props) $$invalidate(1, qrString = $$props.qrString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, qrString];
    }

    class QRPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QRPage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.55.1 */

    // (18:0) {:else}
    function create_else_block(ctx) {
    	let qrpage;
    	let current;
    	qrpage = new QRPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(qrpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(qrpage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qrpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qrpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(qrpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:27) 
    function create_if_block_3(ctx) {
    	let post;
    	let current;
    	post = new Post({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(post.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(post, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(post.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(post.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(post, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(16:27) ",
    		ctx
    	});

    	return block;
    }

    // (14:27) 
    function create_if_block_2(ctx) {
    	let tele;
    	let current;
    	tele = new Tele({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tele.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tele, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tele.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tele.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tele, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(14:27) ",
    		ctx
    	});

    	return block;
    }

    // (12:27) 
    function create_if_block_1(ctx) {
    	let auto;
    	let current;
    	auto = new Auto({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(auto.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(auto, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(auto.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(auto.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(auto, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(12:27) ",
    		ctx
    	});

    	return block;
    }

    // (10:0) {#if $gameStage === 0}
    function create_if_block(ctx) {
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:0) {#if $gameStage === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$gameStage*/ ctx[0] === 0) return 0;
    		if (/*$gameStage*/ ctx[0] === 1) return 1;
    		if (/*$gameStage*/ ctx[0] === 2) return 2;
    		if (/*$gameStage*/ ctx[0] === 3) return 3;
    		return 4;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $gameStage;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(0, $gameStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Login,
    		gameStage,
    		Auto,
    		Tele,
    		Post,
    		QRPage,
    		$gameStage
    	});

    	return [$gameStage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "/*\n! tailwindcss v3.2.4 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n5. Use the user's configured `sans` font-feature-settings by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n  font-feature-settings: normal; /* 5 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/* Make elements with the HTML hidden attribute stay hidden by default */\n[hidden] {\n  display: none;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 201.53 100% 33.333%;\n  --pf: 201.53 100% 26.667%;\n  --sf: 44.912 69.796% 41.569%;\n  --af: 224.28 76.327% 38.431%;\n  --nf: 24 14.286% 5.4902%;\n  --b2: 24 14.286% 6.1765%;\n  --b3: 24 14.286% 5.5588%;\n  --bc: 24 11.579% 81.373%;\n  --pc: 201.53 100% 86.667%;\n  --sc: 44.912 100% 10.392%;\n  --ac: 224.28 100% 89.608%;\n  --nc: 24 11.579% 81.373%;\n  --inc: 198 100% 12%;\n  --suc: 93 100% 12%;\n  --wac: 266.85 100% 91.882%;\n  --erc: 356.02 100% 93.49%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 44.912 69.796% 51.961%;\n  --a: 224.28 76.327% 48.039%;\n  --n: 24 14.286% 6.8627%;\n  --b1: 24 14.286% 6.8627%;\n  --in: 198 93.137% 60%;\n  --su: 93 78.431% 60%;\n  --wa: 266.85 87.44% 59.412%;\n  --er: 356.02 100% 67.451%;\n}\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\r\n.alert {\n  display: flex;\n  width: 100%;\n  flex-direction: column;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  padding: 1rem;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.alert > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));\n}\r\n@media (min-width: 768px) {\n\n  .alert {\n    flex-direction: row;\n  }\n\n  .alert > :not([hidden]) ~ :not([hidden]) {\n    --tw-space-y-reverse: 0;\n    margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));\n    margin-bottom: calc(0px * var(--tw-space-y-reverse));\n  }\n}\r\n.alert > :where(*) {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\r\n.avatar.placeholder > div {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\r\n.badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 1.25rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  width: -moz-fit-content;\n  width: fit-content;\n  padding-left: 0.563rem;\n  padding-right: 0.563rem;\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n  border-radius: var(--rounded-badge, 1.9rem);\n}\r\n.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  text-decoration-line: none;\n  border-width: var(--border-btn, 1px);\n  animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-disabled,\n  .btn[disabled] {\n  pointer-events: none;\n}\r\n.btn-square {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn.loading,\n    .btn.loading:hover {\n  pointer-events: none;\n}\r\n.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}\r\n@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    animation: spin 10s linear infinite;\n  }\n}\r\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\r\n.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}\r\n.card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.card:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\r\n.card-body {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  padding: var(--padding-card, 2rem);\n  gap: 0.5rem;\n}\r\n.card-body :where(p) {\n  flex-grow: 1;\n}\r\n.card figure {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\r\n.card.image-full {\n  display: grid;\n}\r\n.card.image-full:before {\n  position: relative;\n  content: \"\";\n  z-index: 10;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  opacity: 0.75;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.card.image-full:before,\n    .card.image-full > * {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\r\n.card.image-full > figure img {\n  height: 100%;\n  -o-object-fit: cover;\n     object-fit: cover;\n}\r\n.card.image-full > .card-body {\n  position: relative;\n  z-index: 20;\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.checkbox {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.form-control {\n  display: flex;\n  flex-direction: column;\n}\r\n.label {\n  display: flex;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n  align-items: center;\n  justify-content: space-between;\n  padding-left: 0.25rem;\n  padding-right: 0.25rem;\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n}\r\n.hero {\n  display: grid;\n  width: 100%;\n  place-items: center;\n  background-size: cover;\n  background-position: center;\n}\r\n.hero > * {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\r\n.hero-content {\n  z-index: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  max-width: 80rem;\n  gap: 1rem;\n  padding: 1rem;\n}\r\n.indicator {\n  position: relative;\n  display: inline-flex;\n  width: -moz-max-content;\n  width: max-content;\n}\r\n.indicator :where(.indicator-item) {\n  z-index: 1;\n  position: absolute;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.input {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 1rem;\n  line-height: 2;\n  line-height: 1.5rem;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.input-group > .input {\n  isolation: isolate;\n}\r\n.input-group > *,\n  .input-group > .input,\n  .input-group > .textarea,\n  .input-group > .select {\n  border-radius: 0px;\n}\r\n.mask {\n  -webkit-mask-size: contain;\n  mask-size: contain;\n  -webkit-mask-repeat: no-repeat;\n  mask-repeat: no-repeat;\n  -webkit-mask-position: center;\n  mask-position: center;\n}\r\n.mask-half-1 {\n  -webkit-mask-size: 200%;\n  mask-size: 200%;\n  -webkit-mask-position: left;\n  mask-position: left;\n}\r\n.mask-half-2 {\n  -webkit-mask-size: 200%;\n  mask-size: 200%;\n  -webkit-mask-position: right;\n  mask-position: right;\n}\r\n.menu > :where(li.disabled > *:not(ul):focus) {\n  cursor: auto;\n}\r\n.radio {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-radius: 9999px;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  transition: background, box-shadow var(--animation-input, 0.2s) ease-in-out;\n}\r\n.range {\n  height: 1.5rem;\n  width: 100%;\n  cursor: pointer;\n  -moz-appearance: none;\n       appearance: none;\n  -webkit-appearance: none;\n  --range-shdw: var(--bc);\n  overflow: hidden;\n  background-color: transparent;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.range:focus {\n  outline: none;\n}\r\n.rating {\n  position: relative;\n  display: inline-flex;\n}\r\n.rating :where(input) {\n  cursor: pointer;\n  animation: rating-pop var(--animation-input, 0.25s) ease-out;\n  height: 1.5rem;\n  width: 1.5rem;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 1;\n}\r\n.select {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 2.5rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  min-height: 3rem;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  font-weight: 600;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);\n  background-position: calc(100% - 20px) calc(1px + 50%), calc(100% - 16px) calc(1px + 50%);\n  background-size: 4px 4px, 4px 4px;\n  background-repeat: no-repeat;\n}\r\n.select[multiple] {\n  height: auto;\n}\r\n.steps .step {\n  display: grid;\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n  grid-template-columns: auto;\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n  grid-template-rows: 40px 1fr;\n  place-items: center;\n  text-align: center;\n  min-width: 4rem;\n}\r\n.textarea {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  min-height: 3rem;\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.alert-info {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--in) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--inc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.badge-secondary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.badge-warning {\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.badge-outline.badge-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.badge-outline.badge-warning {\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  background-color: transparent;\n}\r\n.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--ac) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btm-nav>*.disabled,\n    .btm-nav>*.disabled:hover,\n    .btm-nav>*[disabled],\n    .btm-nav>*[disabled]:hover {\n  pointer-events: none;\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btm-nav>* .label {\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.btn:active:hover,\n  .btn:active:focus {\n  animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}\r\n.btn:hover,\n    .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}\r\n.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\r\n.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-primary:hover,\n    .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}\r\n.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-secondary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-secondary:hover,\n    .btn-secondary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n}\r\n.btn-secondary:focus-visible {\n  outline: 2px solid hsl(var(--s));\n}\r\n.btn-accent {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-accent:hover,\n    .btn-accent.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--af, var(--a)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n}\r\n.btn-accent:focus-visible {\n  outline: 2px solid hsl(var(--a));\n}\r\n.btn-warning {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-warning:hover,\n    .btn-warning.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n}\r\n.btn-warning:focus-visible {\n  outline: 2px solid hsl(var(--wa));\n}\r\n.btn-error {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-error:hover,\n    .btn-error.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n}\r\n.btn-error:focus-visible {\n  outline: 2px solid hsl(var(--er));\n}\r\n.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}\r\n.btn.glass:focus-visible {\n  outline: 2px solid currentColor;\n}\r\n.btn-outline {\n  border-color: currentColor;\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover,\n    .btn-outline.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--b1) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover,\n      .btn-outline.btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover,\n      .btn-outline.btn-secondary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent {\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover,\n      .btn-outline.btn-accent.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--af, var(--a)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success {\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success:hover,\n      .btn-outline.btn-success.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--suc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info {\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info:hover,\n      .btn-outline.btn-info.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--in) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--inc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning {\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning:hover,\n      .btn-outline.btn-warning.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error {\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error:hover,\n      .btn-outline.btn-error.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-disabled,\n  .btn-disabled:hover,\n  .btn[disabled],\n  .btn[disabled]:hover {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btn.loading.btn-square:before,\n    .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}\r\n.btn.loading.btn-xl:before,\n    .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}\r\n.btn.loading.btn-sm:before,\n    .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn,\n  .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n.card :where(figure:first-child) {\n  overflow: hidden;\n  border-start-start-radius: inherit;\n  border-start-end-radius: inherit;\n  border-end-start-radius: unset;\n  border-end-end-radius: unset;\n}\r\n.card :where(figure:last-child) {\n  overflow: hidden;\n  border-start-start-radius: unset;\n  border-start-end-radius: unset;\n  border-end-start-radius: inherit;\n  border-end-end-radius: inherit;\n}\r\n.card:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\r\n.card.bordered {\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n}\r\n.card.compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.card.image-full :where(figure) {\n  overflow: hidden;\n  border-radius: inherit;\n}\r\n.checkbox:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.checkbox:checked,\n  .checkbox[checked=\"true\"],\n  .checkbox[aria-checked=\"true\"] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(-45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.checkbox:indeterminate {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(-90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(0deg, hsl(var(--chkbg)) 43%, hsl(var(--chkfg)) 43%, hsl(var(--chkfg)) 57%, hsl(var(--chkbg)) 57%);\n}\r\n.checkbox-primary {\n  --chkbg: var(--p);\n  --chkfg: var(--pc);\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.checkbox-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.checkbox-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.checkbox-primary:checked,\n    .checkbox-primary[checked=\"true\"],\n    .checkbox-primary[aria-checked=\"true\"] {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.checkbox:disabled {\n  cursor: not-allowed;\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  opacity: 0.2;\n}\r\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n[dir=\"rtl\"] .checkbox:checked,\n    [dir=\"rtl\"] .checkbox[checked=\"true\"],\n    [dir=\"rtl\"] .checkbox[aria-checked=\"true\"] {\n  background-image: linear-gradient(45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(-45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-secondary {\n  outline: 2px solid hsl(var(--s));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-accent {\n  outline: 2px solid hsl(var(--a));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-warning {\n  outline: 2px solid hsl(var(--wa));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-error {\n  outline: 2px solid hsl(var(--er));\n}\r\n.label-text {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.label a:hover {\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.input[list]::-webkit-calendar-picker-indicator {\n  line-height: 1em;\n}\r\n.input-bordered {\n  --tw-border-opacity: 0.2;\n}\r\n.input:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.input-disabled,\n  .input[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.input-disabled::-moz-placeholder, .input[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.input-disabled::placeholder,\n  .input[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.mask-star-2 {\n  -webkit-mask-image: url(\"data:image/svg+xml,%3csvg width='192' height='180' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m96 153.044-58.779 26.243 7.02-63.513L.894 68.481l63.117-13.01L96 0l31.989 55.472 63.117 13.01-43.347 47.292 7.02 63.513z' fill-rule='evenodd'/%3e%3c/svg%3e\");\n  mask-image: url(\"data:image/svg+xml,%3csvg width='192' height='180' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m96 153.044-58.779 26.243 7.02-63.513L.894 68.481l63.117-13.01L96 0l31.989 55.472 63.117 13.01-43.347 47.292 7.02 63.513z' fill-rule='evenodd'/%3e%3c/svg%3e\");\n}\r\n.menu li.disabled > * {\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.menu li.disabled > *:hover {\n  background-color: transparent;\n}\r\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n.radio:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.radio:checked,\n  .radio[aria-checked=true] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n  box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n}\r\n.radio:disabled {\n  cursor: not-allowed;\n  opacity: 0.2;\n}\r\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n.range:focus-visible::-webkit-slider-thumb {\n  --focus-shadow: 0 0 0 6px hsl(var(--b1)) inset, 0 0 0 2rem hsl(var(--range-shdw)) inset;\n}\r\n.range:focus-visible::-moz-range-thumb {\n  --focus-shadow: 0 0 0 6px hsl(var(--b1)) inset, 0 0 0 2rem hsl(var(--range-shdw)) inset;\n}\r\n.range::-webkit-slider-runnable-track {\n  height: 0.5rem;\n  width: 100%;\n  border-radius: var(--rounded-box, 1rem);\n  background-color: hsla(var(--bc) / 0.1);\n}\r\n.range::-moz-range-track {\n  height: 0.5rem;\n  width: 100%;\n  border-radius: var(--rounded-box, 1rem);\n  background-color: hsla(var(--bc) / 0.1);\n}\r\n.range::-webkit-slider-thumb {\n  background-color: hsl(var(--b1));\n  position: relative;\n  height: 1.5rem;\n  width: 1.5rem;\n  border-style: none;\n  border-radius: var(--rounded-box, 1rem);\n  appearance: none;\n  -webkit-appearance: none;\n  top: 50%;\n  color: hsl(var(--range-shdw));\n  transform: translateY(-50%);\n  --filler-size: 100rem;\n  --filler-offset: 0.6rem;\n  box-shadow: 0 0 0 3px hsl(var(--range-shdw)) inset, var(--focus-shadow, 0 0), calc(var(--filler-size) * -1 - var(--filler-offset)) 0 0 var(--filler-size);\n}\r\n.range::-moz-range-thumb {\n  background-color: hsl(var(--b1));\n  position: relative;\n  height: 1.5rem;\n  width: 1.5rem;\n  border-style: none;\n  border-radius: var(--rounded-box, 1rem);\n  top: 50%;\n  color: hsl(var(--range-shdw));\n  --filler-size: 100rem;\n  --filler-offset: 0.5rem;\n  box-shadow: 0 0 0 3px hsl(var(--range-shdw)) inset, var(--focus-shadow, 0 0), calc(var(--filler-size) * -1 - var(--filler-offset)) 0 0 var(--filler-size);\n}\r\n.range-primary {\n  --range-shdw: var(--p);\n}\r\n.rating input {\n  -moz-appearance: none;\n       appearance: none;\n  -webkit-appearance: none;\n}\r\n.rating .rating-hidden {\n  width: 0.5rem;\n  background-color: transparent;\n}\r\n.rating input:checked ~ input,\n  .rating input[aria-checked=true] ~ input {\n  --tw-bg-opacity: 0.2;\n}\r\n.rating input:focus-visible {\n  transition-property: transform;\n  transition-duration: 300ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transform: translateY(-0.125em);\n}\r\n.rating input:active:focus {\n  animation: none;\n  transform: translateY(-0.125em);\n}\r\n.rating-half :where(input:not(.rating-hidden)) {\n  width: 0.75rem;\n}\r\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n.select:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.select-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.select-primary:focus {\n  outline: 2px solid hsl(var(--p));\n}\r\n.select-disabled,\n  .select[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.select-disabled::-moz-placeholder, .select[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.select-disabled::placeholder,\n  .select[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.select-multiple,\n  .select[multiple],\n  .select[size].select:not([size=\"1\"]) {\n  background-image: none;\n  padding-right: 1rem;\n}\r\n[dir=\"rtl\"] .select {\n  background-position: calc(0% + 12px) calc(1px + 50%), calc(0% + 16px) calc(1px + 50%);\n}\r\n.steps .step:before {\n  top: 0px;\n  grid-column-start: 1;\n  grid-row-start: 1;\n  height: 0.5rem;\n  width: 100%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  content: \"\";\n  margin-left: -100%;\n}\r\n.steps .step:after {\n  content: counter(step);\n  counter-increment: step;\n  z-index: 1;\n  position: relative;\n  grid-column-start: 1;\n  grid-row-start: 1;\n  display: grid;\n  height: 2rem;\n  width: 2rem;\n  place-items: center;\n  place-self: center;\n  border-radius: 9999px;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.steps .step:first-child:before {\n  content: none;\n}\r\n.steps .step[data-content]:after {\n  content: attr(data-content);\n}\r\n.textarea-bordered {\n  --tw-border-opacity: 0.2;\n}\r\n.textarea:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.textarea-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.textarea-primary:focus {\n  outline: 2px solid hsl(var(--p));\n}\r\n.textarea-disabled,\n  .textarea[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.textarea-disabled::-moz-placeholder, .textarea[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.textarea-disabled::placeholder,\n  .textarea[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n@keyframes toast-pop {\n\n  0% {\n    transform: scale(0.9);\n    opacity: 0;\n  }\n\n  100% {\n    transform: scale(1);\n    opacity: 1;\n  }\n}\r\n.btn-md {\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  min-height: 3rem;\n  font-size: 0.875rem;\n}\r\n.btn-square:where(.btn-xs) {\n  height: 1.5rem;\n  width: 1.5rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-sm) {\n  height: 2rem;\n  width: 2rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-lg) {\n  height: 4rem;\n  width: 4rem;\n  padding: 0px;\n}\r\n.btn-circle:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  border-radius: 9999px;\n  padding: 0px;\n}\r\n.checkbox-lg {\n  height: 2rem;\n  width: 2rem;\n}\r\n.indicator :where(.indicator-item) {\n  right: 0px;\n  left: auto;\n  top: 0px;\n  bottom: auto;\n  --tw-translate-x: 50%;\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-start) {\n  right: auto;\n  left: 0px;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-center) {\n  right: 50%;\n  left: 50%;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-end) {\n  right: 0px;\n  left: auto;\n  --tw-translate-x: 50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-bottom) {\n  top: auto;\n  bottom: 0px;\n  --tw-translate-y: 50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-middle) {\n  top: 50%;\n  bottom: 50%;\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-top) {\n  top: 0px;\n  bottom: auto;\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.rating-lg input {\n  height: 2.5rem;\n  width: 2.5rem;\n}\r\n.rating-half.rating-xs input:not(.rating-hidden) {\n  width: 0.375rem;\n}\r\n.rating-half.rating-sm input:not(.rating-hidden) {\n  width: 0.5rem;\n}\r\n.rating-half.rating-md input:not(.rating-hidden) {\n  width: 0.75rem;\n}\r\n.rating-half.rating-lg input:not(.rating-hidden) {\n  width: 1.25rem;\n}\r\n.steps-horizontal .step {\n  display: grid;\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n  place-items: center;\n  text-align: center;\n}\r\n.steps-vertical .step {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  grid-template-rows: repeat(1, minmax(0, 1fr));\n}\r\n.textarea-lg {\n  padding-top: 1rem;\n  padding-bottom: 1rem;\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n  line-height: 2;\n}\r\n.btn-group .btn:not(:first-child):not(:last-child), .btn-group.btn-group-horizontal .btn:not(:first-child):not(:last-child) {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n}\r\n.btn-group .btn:first-child:not(:last-child), .btn-group.btn-group-horizontal .btn:first-child:not(:last-child) {\n  margin-left: -1px;\n  margin-top: -0px;\n  border-top-left-radius: var(--rounded-btn, 0.5rem);\n  border-top-right-radius: 0;\n  border-bottom-left-radius: var(--rounded-btn, 0.5rem);\n  border-bottom-right-radius: 0;\n}\r\n.btn-group .btn:last-child:not(:first-child), .btn-group.btn-group-horizontal .btn:last-child:not(:first-child) {\n  border-top-left-radius: 0;\n  border-top-right-radius: var(--rounded-btn, 0.5rem);\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: var(--rounded-btn, 0.5rem);\n}\r\n.btn-group.btn-group-vertical .btn:first-child:not(:last-child) {\n  margin-left: -0px;\n  margin-top: -1px;\n  border-top-left-radius: var(--rounded-btn, 0.5rem);\n  border-top-right-radius: var(--rounded-btn, 0.5rem);\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n}\r\n.btn-group.btn-group-vertical .btn:last-child:not(:first-child) {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  border-bottom-left-radius: var(--rounded-btn, 0.5rem);\n  border-bottom-right-radius: var(--rounded-btn, 0.5rem);\n}\r\n.card-compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.card-normal .card-body {\n  padding: var(--padding-card, 2rem);\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.steps-horizontal .step {\n  grid-template-rows: 40px 1fr;\n  grid-template-columns: auto;\n  min-width: 4rem;\n}\r\n.steps-horizontal .step:before {\n  height: 0.5rem;\n  width: 100%;\n  --tw-translate-y: 0px;\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  content: \"\";\n  margin-left: -100%;\n}\r\n.steps-vertical .step {\n  gap: 0.5rem;\n  grid-template-columns: 40px 1fr;\n  grid-template-rows: auto;\n  min-height: 4rem;\n  justify-items: start;\n}\r\n.steps-vertical .step:before {\n  height: 100%;\n  width: 0.5rem;\n  --tw-translate-y: -50%;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  margin-left: 50%;\n}\r\n.fixed {\n  position: fixed;\n}\r\n.absolute {\n  position: absolute;\n}\r\n.bottom-0 {\n  bottom: 0px;\n}\r\n.z-20 {\n  z-index: 20;\n}\r\n.z-10 {\n  z-index: 10;\n}\r\n.z-50 {\n  z-index: 50;\n}\r\n.m-10 {\n  margin: 2.5rem;\n}\r\n.mx-auto {\n  margin-left: auto;\n  margin-right: auto;\n}\r\n.ml-2 {\n  margin-left: 0.5rem;\n}\r\n.-mt-4 {\n  margin-top: -1rem;\n}\r\n.-mt-2 {\n  margin-top: -0.5rem;\n}\r\n.mt-7 {\n  margin-top: 1.75rem;\n}\r\n.ml-8 {\n  margin-left: 2rem;\n}\r\n.ml-16 {\n  margin-left: 4rem;\n}\r\n.mt-8 {\n  margin-top: 2rem;\n}\r\n.-mt-5 {\n  margin-top: -1.25rem;\n}\r\n.mt-6 {\n  margin-top: 1.5rem;\n}\r\n.ml-3 {\n  margin-left: 0.75rem;\n}\r\n.mt-2 {\n  margin-top: 0.5rem;\n}\r\n.mb-2 {\n  margin-bottom: 0.5rem;\n}\r\n.mr-2 {\n  margin-right: 0.5rem;\n}\r\n.-ml-3 {\n  margin-left: -0.75rem;\n}\r\n.mr-\\[320px\\] {\n  margin-right: 320px;\n}\r\n.-mt-1 {\n  margin-top: -0.25rem;\n}\r\n.ml-11 {\n  margin-left: 2.75rem;\n}\r\n.flex {\n  display: flex;\n}\r\n.h-28 {\n  height: 7rem;\n}\r\n.h-20 {\n  height: 5rem;\n}\r\n.h-16 {\n  height: 4rem;\n}\r\n.h-48 {\n  height: 12rem;\n}\r\n.h-6 {\n  height: 1.5rem;\n}\r\n.h-screen {\n  height: 100vh;\n}\r\n.h-24 {\n  height: 6rem;\n}\r\n.min-h-screen {\n  min-height: 100vh;\n}\r\n.w-full {\n  width: 100%;\n}\r\n.w-12 {\n  width: 3rem;\n}\r\n.w-28 {\n  width: 7rem;\n}\r\n.w-20 {\n  width: 5rem;\n}\r\n.w-16 {\n  width: 4rem;\n}\r\n.w-72 {\n  width: 18rem;\n}\r\n.w-48 {\n  width: 12rem;\n}\r\n.w-6 {\n  width: 1.5rem;\n}\r\n.w-screen {\n  width: 100vw;\n}\r\n.w-24 {\n  width: 6rem;\n}\r\n.w-64 {\n  width: 16rem;\n}\r\n.w-\\[270px\\] {\n  width: 270px;\n}\r\n.max-w-sm {\n  max-width: 24rem;\n}\r\n.max-w-xs {\n  max-width: 20rem;\n}\r\n.flex-shrink-0 {\n  flex-shrink: 0;\n}\r\n.transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.cursor-pointer {\n  cursor: pointer;\n}\r\n.flex-col {\n  flex-direction: column;\n}\r\n.content-center {\n  align-content: center;\n}\r\n.items-center {\n  align-items: center;\n}\r\n.justify-center {\n  justify-content: center;\n}\r\n.justify-between {\n  justify-content: space-between;\n}\r\n.rounded-md {\n  border-radius: 0.375rem;\n}\r\n.bg-base-100 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n}\r\n.bg-base-200 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n}\r\n.bg-primary {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n}\r\n.fill-warning {\n  fill: hsl(var(--wa));\n}\r\n.fill-secondary {\n  fill: hsl(var(--s));\n}\r\n.fill-base-100 {\n  fill: hsl(var(--b1));\n}\r\n.stroke-warning {\n  stroke: hsl(var(--wa));\n}\r\n.stroke-secondary {\n  stroke: hsl(var(--s));\n}\r\n.stroke-current {\n  stroke: currentColor;\n}\r\n.p-2 {\n  padding: 0.5rem;\n}\r\n.p-5 {\n  padding: 1.25rem;\n}\r\n.py-6 {\n  padding-top: 1.5rem;\n  padding-bottom: 1.5rem;\n}\r\n.px-2 {\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n}\r\n.pt-4 {\n  padding-top: 1rem;\n}\r\n.pl-4 {\n  padding-left: 1rem;\n}\r\n.text-center {\n  text-align: center;\n}\r\n.text-3xl {\n  font-size: 1.875rem;\n  line-height: 2.25rem;\n}\r\n.text-base {\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.text-5xl {\n  font-size: 3rem;\n  line-height: 1;\n}\r\n.text-sm {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.text-xl {\n  font-size: 1.25rem;\n  line-height: 1.75rem;\n}\r\n.font-bold {\n  font-weight: 700;\n}\r\n.shadow-2xl {\n  --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);\n  --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\r\n.shadow-lg {\n  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\r\n/*My hatred for CSS is present in the emptiness of this file*/\r\n@media (min-width: 1024px) {\n\n  .lg\\:flex-row-reverse {\n    flex-direction: row-reverse;\n  }\n\n  .lg\\:text-left {\n    text-align: left;\n  }\n}\r\n@media (min-width: 1280px) {\n\n  .xl\\:mb-4 {\n    margin-bottom: 1rem;\n  }\n\n  .xl\\:ml-4 {\n    margin-left: 1rem;\n  }\n\n  .xl\\:h-64 {\n    height: 16rem;\n  }\n\n  .xl\\:h-48 {\n    height: 12rem;\n  }\n\n  .xl\\:h-8 {\n    height: 2rem;\n  }\n\n  .xl\\:h-36 {\n    height: 9rem;\n  }\n\n  .xl\\:h-24 {\n    height: 6rem;\n  }\n\n  .xl\\:w-64 {\n    width: 16rem;\n  }\n\n  .xl\\:w-48 {\n    width: 12rem;\n  }\n\n  .xl\\:w-24 {\n    width: 6rem;\n  }\n\n  .xl\\:w-28 {\n    width: 7rem;\n  }\n\n  .xl\\:w-12 {\n    width: 3rem;\n  }\n\n  .xl\\:w-36 {\n    width: 9rem;\n  }\n\n  .xl\\:w-80 {\n    width: 20rem;\n  }\n\n  .xl\\:p-10 {\n    padding: 2.5rem;\n  }\n\n  .xl\\:pl-0 {\n    padding-left: 0px;\n  }\n\n  .xl\\:pl-8 {\n    padding-left: 2rem;\n  }\n\n  .xl\\:text-lg {\n    font-size: 1.125rem;\n    line-height: 1.75rem;\n  }\n\n  .xl\\:text-2xl {\n    font-size: 1.5rem;\n    line-height: 2rem;\n  }\n\n  .xl\\:text-3xl {\n    font-size: 1.875rem;\n    line-height: 2.25rem;\n  }\n}\r\n\r\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
