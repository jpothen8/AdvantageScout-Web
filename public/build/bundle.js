
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update$1(component.$$);
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
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
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
            ctx: null,
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
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

    /* src\Login.svelte generated by Svelte v3.49.0 */

    const { console: console_1$2 } = globals;
    const file$i = "src\\Login.svelte";

    // (61:16) {:else}
    function create_else_block$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Blue";
    			attr_dev(button, "class", "btn btn-accent");
    			add_location(button, file$i, 61, 16, 2129);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(61:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:16) {#if allianceColor === "red"}
    function create_if_block$4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Red";
    			attr_dev(button, "class", "btn btn-error");
    			add_location(button, file$i, 59, 16, 2013);
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(59:16) {#if allianceColor === \\\"red\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
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
    		if (/*allianceColor*/ ctx[0] === "red") return create_if_block$4;
    		return create_else_block$2;
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
    			p.textContent = "A comprehensive, easy to use, QR based scouting application made by FRC 6328";
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
    			add_location(h1, file$i, 36, 12, 919);
    			attr_dev(p, "class", "py-6");
    			add_location(p, file$i, 37, 12, 984);
    			attr_dev(div0, "class", "text-center lg:text-left");
    			add_location(div0, file$i, 35, 8, 867);
    			attr_dev(span0, "class", "label-text");
    			add_location(span0, file$i, 43, 24, 1327);
    			attr_dev(label0, "class", "label");
    			add_location(label0, file$i, 42, 20, 1280);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "name");
    			attr_dev(input0, "class", "input input-bordered");
    			add_location(input0, file$i, 45, 20, 1420);
    			attr_dev(div1, "class", "form-control");
    			add_location(div1, file$i, 41, 16, 1232);
    			attr_dev(span1, "class", "label-text");
    			add_location(span1, file$i, 49, 24, 1626);
    			attr_dev(label1, "class", "label");
    			add_location(label1, file$i, 48, 20, 1579);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "team #");
    			attr_dev(input1, "class", "input input-bordered");
    			add_location(input1, file$i, 51, 20, 1716);
    			attr_dev(div2, "class", "form-control");
    			add_location(div2, file$i, 47, 16, 1531);
    			attr_dev(span2, "class", "label-text");
    			add_location(span2, file$i, 55, 20, 1874);
    			attr_dev(label2, "class", "label");
    			add_location(label2, file$i, 54, 16, 1831);
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$i, 65, 20, 2300);
    			attr_dev(div3, "class", "form-control mt-6");
    			add_location(div3, file$i, 64, 16, 2247);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$i, 40, 12, 1191);
    			attr_dev(div5, "class", "card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100");
    			add_location(div5, file$i, 39, 8, 1106);
    			attr_dev(div6, "class", "hero-content flex-col lg:flex-row-reverse");
    			add_location(div6, file$i, 34, 4, 802);
    			attr_dev(div7, "class", "hero min-h-screen bg-base-200");
    			add_location(div7, file$i, 33, 0, 753);
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
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div2, label1);
    			append_dev(label1, span1);
    			append_dev(div2, t8);
    			append_dev(div2, input1);
    			append_dev(div4, t9);
    			append_dev(div4, label2);
    			append_dev(label2, span2);
    			append_dev(div4, t11);
    			if_block.m(div4, null);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*goToAuto*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    			dispose();
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
    	let $gameStage;
    	validate_store(gameStage, 'gameStage');
    	component_subscribe($$self, gameStage, $$value => $$invalidate(4, $gameStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let allianceColor = "blue";
    	let timer;

    	function changeColor() {
    		if (allianceColor === "red") {
    			$$invalidate(0, allianceColor = "blue");
    		} else {
    			$$invalidate(0, allianceColor = "red");
    		}

    		console.log(allianceColor);
    	}

    	const changeColorDebounce = e => {
    		clearTimeout(timer);

    		timer = setTimeout(
    			() => {
    				if (allianceColor === "red") {
    					$$invalidate(0, allianceColor = "blue");
    				} else {
    					$$invalidate(0, allianceColor = "red");
    				}

    				console.log(allianceColor);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		gameStage,
    		allianceColor,
    		timer,
    		changeColor,
    		changeColorDebounce,
    		goToAuto,
    		$gameStage
    	});

    	$$self.$inject_state = $$props => {
    		if ('allianceColor' in $$props) $$invalidate(0, allianceColor = $$props.allianceColor);
    		if ('timer' in $$props) timer = $$props.timer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [allianceColor, changeColorDebounce, goToAuto];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\ScoringLocation.svelte generated by Svelte v3.49.0 */

    const file$h = "src\\ScoringLocation.svelte";

    // (37:8) {:else}
    function create_else_block$1(ctx) {
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
    			add_location(g0, file$h, 44, 13, 1529);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$h, 44, 58, 1574);
    			attr_dev(path, "d", "M13.41,12l6.3-6.29a1,1,0,1,0-1.42-1.42L12,10.59,5.71,4.29A1,1,0,0,0,4.29,5.71L10.59,12l-6.3,6.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L12,13.41l6.29,6.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z");
    			add_location(path, file$h, 49, 13, 1771);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$h, 48, 14, 1729);
    			attr_dev(svg, "fill", "#e31c1c");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "id", "cross");
    			attr_dev(svg, "class", "icon glyph");
    			attr_dev(svg, "stroke", "#e31c1c");
    			add_location(svg, file$h, 37, 12, 1267);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(37:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {#if type === "Success"}
    function create_if_block$3(ctx) {
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
    			add_location(g0, file$h, 25, 13, 783);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$h, 25, 58, 828);
    			attr_dev(polygon, "fill-rule", "evenodd");
    			attr_dev(polygon, "points", "9.707 14.293 19 5 20.414 6.414 9.707 17.121 4 11.414 5.414 10");
    			add_location(polygon, file$h, 30, 16, 1029);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$h, 29, 14, 983);
    			attr_dev(svg, "fill", "#1bbb43");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "stroke", "#1bbb43");
    			add_location(svg, file$h, 20, 12, 593);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(20:8) {#if type === \\\"Success\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] === "Success") return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			span0.textContent = "2";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "2";
    			t3 = space();
    			button = element("button");
    			if_block.c();
    			attr_dev(span0, "class", "indicator-item badge badge-warning text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span0, file$h, 9, 4, 146);
    			attr_dev(span1, "class", "indicator-item indicator-start badge badge-secondary text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span1, file$h, 12, 4, 256);
    			attr_dev(button, "class", "btn btn-square btn-outline rounded-md w-24 h-24 xl:w-36 xl:h-36");
    			button.disabled = /*liveGamepiece*/ ctx[1] === 0;
    			add_location(button, file$h, 15, 4, 384);
    			attr_dev(div, "class", "indicator");
    			add_location(div, file$h, 8, 0, 117);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(div, t3);
    			append_dev(div, button);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", update, false, false, false);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function update() {
    	
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScoringLocation', slots, []);
    	let liveGamepiece = 1;
    	let { type = "Success" } = $$props;
    	const writable_props = ['type'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScoringLocation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({ liveGamepiece, type, update });

    	$$self.$inject_state = $$props => {
    		if ('liveGamepiece' in $$props) $$invalidate(1, liveGamepiece = $$props.liveGamepiece);
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, liveGamepiece];
    }

    class ScoringLocation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScoringLocation",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get type() {
    		throw new Error("<ScoringLocation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<ScoringLocation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\TrashCan.svelte generated by Svelte v3.49.0 */

    const { console: console_1$1 } = globals;
    const file$g = "src\\TrashCan.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let span0;
    	let t1;
    	let span1;
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
    			span0.textContent = `${/*displayCubeValue*/ ctx[1]}`;
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = `${/*displayConeValue*/ ctx[0]}`;
    			t3 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(span0, "class", "indicator-item badge badge-warning text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span0, file$g, 16, 4, 274);
    			attr_dev(span1, "class", "indicator-item indicator-start badge badge-secondary text-xl xl:w-12 xl:h-8 xl:text-2xl");
    			add_location(span1, file$g, 19, 4, 401);
    			attr_dev(g0, "id", "SVGRepo_bgCarrier");
    			attr_dev(g0, "stroke-width", "0");
    			add_location(g0, file$g, 34, 12, 1031);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			attr_dev(g1, "stroke", "#ffffff");
    			attr_dev(g1, "stroke-width", "16.384");
    			add_location(g1, file$g, 36, 12, 1092);
    			attr_dev(path0, "d", "M692.2 182.2V72.9H327.8v109.3H145.6v72.9h728.8v-72.9H692.2z m-291.5 0v-36.4h218.6v36.4H400.7zM730.8 874.5H289.2l-34.3-548.8-72.8 4.5 38.6 617.2h578.6l38.6-617.2-72.8-4.5z");
    			attr_dev(path0, "fill", "#ffffff");
    			add_location(path0, file$g, 45, 16, 1390);
    			attr_dev(path1, "d", "M400.7 400.8h72.9v437.3h-72.9zM546.4 400.8h72.9v437.3h-72.9z");
    			attr_dev(path1, "fill", "#ffffff");
    			add_location(path1, file$g, 50, 16, 1675);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$g, 44, 12, 1344);
    			attr_dev(svg, "viewBox", "0 0 1024.00 1024.00");
    			attr_dev(svg, "class", "icon w-16 h-16 xl:w-24 xl:h-24");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "#ffffff");
    			attr_dev(svg, "stroke", "#ffffff");
    			attr_dev(svg, "stroke-width", "12.288");
    			attr_dev(svg, "transform", "rotate(0)");
    			add_location(svg, file$g, 23, 8, 670);
    			attr_dev(button, "class", "btn btn-square btn-outline w-24 h-24 btn-error xl:w-36 xl:h-36");
    			button.disabled = false;
    			add_location(button, file$g, 22, 4, 546);
    			attr_dev(div, "class", "indicator");
    			add_location(div, file$g, 15, 0, 245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(div, t3);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, g0);
    			append_dev(svg, g1);
    			append_dev(svg, g2);
    			append_dev(g2, path0);
    			append_dev(g2, path1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*update*/ ctx[2], false, false, false);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TrashCan', slots, []);
    	let { gameMode = "Auto" } = $$props;
    	let displayConeValue = 0;
    	let displayCubeValue = 0;
    	let dataField = " ";

    	function update() {
    		console.log("score");
    		console.log(dataField);
    	}

    	const writable_props = ['gameMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<TrashCan> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('gameMode' in $$props) $$invalidate(3, gameMode = $$props.gameMode);
    	};

    	$$self.$capture_state = () => ({
    		gameMode,
    		displayConeValue,
    		displayCubeValue,
    		dataField,
    		update
    	});

    	$$self.$inject_state = $$props => {
    		if ('gameMode' in $$props) $$invalidate(3, gameMode = $$props.gameMode);
    		if ('displayConeValue' in $$props) $$invalidate(0, displayConeValue = $$props.displayConeValue);
    		if ('displayCubeValue' in $$props) $$invalidate(1, displayCubeValue = $$props.displayCubeValue);
    		if ('dataField' in $$props) dataField = $$props.dataField;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [displayConeValue, displayCubeValue, update, gameMode];
    }

    class TrashCan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { gameMode: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TrashCan",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get gameMode() {
    		throw new Error("<TrashCan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameMode(value) {
    		throw new Error("<TrashCan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\NextStageButton.svelte generated by Svelte v3.49.0 */
    const file$f = "src\\NextStageButton.svelte";

    function create_fragment$g(ctx) {
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
    			add_location(path, file$f, 12, 8, 378);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48");
    			add_location(svg, file$f, 11, 4, 180);
    			attr_dev(button, "class", "btn btn-outline w-12 h-28 z-50 xl:h-64 xl:w-24");
    			add_location(button, file$f, 15, 0, 479);
    			attr_dev(div, "class", "flex items-center justify-center ");
    			add_location(div, file$f, 9, 0, 125);
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NextStageButton",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\ScoringLocationCombo.svelte generated by Svelte v3.49.0 */
    const file$e = "src\\ScoringLocationCombo.svelte";

    function create_fragment$f(ctx) {
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
    	scoringlocation0 = new ScoringLocation({ $$inline: true });
    	scoringlocation1 = new ScoringLocation({ props: { type: "Fail" }, $$inline: true });
    	scoringlocation2 = new ScoringLocation({ $$inline: true });
    	scoringlocation3 = new ScoringLocation({ props: { type: "Fail" }, $$inline: true });
    	scoringlocation4 = new ScoringLocation({ $$inline: true });
    	scoringlocation5 = new ScoringLocation({ props: { type: "Fail" }, $$inline: true });
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
    			add_location(div0, file$e, 8, 8, 279);
    			attr_dev(div1, "class", "p-5 mr-2 xl:p-10");
    			add_location(div1, file$e, 11, 8, 359);
    			attr_dev(div2, "class", "text-center -ml-3 text-xl font-bold xl:text-3xl");
    			add_location(div2, file$e, 14, 8, 460);
    			attr_dev(div3, "class", "flex items-center mb-2 xl:mb-4");
    			add_location(div3, file$e, 7, 4, 225);
    			attr_dev(div4, "class", "p-2 mr-2");
    			add_location(div4, file$e, 17, 8, 595);
    			attr_dev(div5, "class", "p-5 mr-2 xl:p-10");
    			add_location(div5, file$e, 20, 8, 676);
    			attr_dev(div6, "class", "text-center -ml-3 text-xl font-bold xl:text-3xl");
    			add_location(div6, file$e, 23, 8, 777);
    			attr_dev(div7, "class", "flex items-center mb-2");
    			add_location(div7, file$e, 16, 4, 549);
    			attr_dev(div8, "class", "p-2 mr-2");
    			add_location(div8, file$e, 26, 8, 906);
    			attr_dev(div9, "class", "p-5 mr-2 xl:p-10");
    			add_location(div9, file$e, 29, 8, 987);
    			attr_dev(div10, "class", "text-center -ml-3 text-xl font-bold xl:text-3xl");
    			add_location(div10, file$e, 32, 8, 1088);
    			attr_dev(div11, "class", "flex items-center");
    			add_location(div11, file$e, 25, 4, 865);
    			attr_dev(div12, "class", "p-2 mr-2");
    			add_location(div12, file$e, 35, 8, 1220);
    			attr_dev(div13, "class", "text-center text-xl font-bold xl:text-3xl xl:ml-4");
    			add_location(div13, file$e, 39, 8, 1296);
    			attr_dev(div14, "class", "flex items-center");
    			add_location(div14, file$e, 34, 4, 1179);
    			attr_dev(div15, "class", "flex flex-col");
    			add_location(div15, file$e, 6, 0, 192);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScoringLocationCombo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScoringLocationCombo> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ScoringLocation,
    		TrashCan,
    		NextStageButton
    	});

    	return [];
    }

    class ScoringLocationCombo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScoringLocationCombo",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\GamePiece.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;
    const file$d = "src\\GamePiece.svelte";

    // (32:4) {:else}
    function create_else_block(ctx) {
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
    			add_location(g0, file$d, 36, 9, 1855);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$d, 36, 54, 1900);
    			attr_dev(path, "d", "M7.03 1.88c.252-1.01 1.688-1.01 1.94 0l2.905 11.62H14a.5.5 0 0 1 0 1H2a.5.5 0 0 1 0-1h2.125L7.03 1.88z");
    			add_location(path, file$d, 41, 12, 2081);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$d, 40, 10, 2039);
    			attr_dev(svg, "class", "bi bi-cone w-20 h-20 xl:w-48 xl:h-48 fill-secondary stroke-secondary");
    			attr_dev(svg, "viewBox", "0 0 16.00 16.00");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$d, 32, 8, 1650);
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(32:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if gamePiece === "Cube"}
    function create_if_block$2(ctx) {
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
    			add_location(g0, file$d, 21, 9, 629);
    			attr_dev(g1, "id", "SVGRepo_tracerCarrier");
    			attr_dev(g1, "stroke-linecap", "round");
    			attr_dev(g1, "stroke-linejoin", "round");
    			add_location(g1, file$d, 21, 54, 674);
    			attr_dev(path, "d", "M 28.0000 26.6406 L 50.0783 14.1016 C 49.7264 13.75 49.3045 13.4688 48.7890 13.1875 L 32.2657 3.7657 C 30.8126 2.9453 29.4063 2.5000 28.0000 2.5000 C 26.5938 2.5000 25.1875 2.9453 23.7344 3.7657 L 7.2110 13.1875 C 6.6954 13.4688 6.2735 13.75 5.9219 14.1016 Z M 26.4063 53.5 L 26.4063 29.4532 L 4.3985 16.8906 C 4.2813 17.4063 4.2110 17.9688 4.2110 18.6719 L 4.2110 36.9297 C 4.2110 40.3281 5.4063 41.5938 7.5860 42.8360 L 25.9375 53.2891 C 26.1016 53.3828 26.2422 53.4532 26.4063 53.5 Z M 29.5938 53.5 C 29.7579 53.4532 29.8985 53.3828 30.0626 53.2891 L 48.4141 42.8360 C 50.5938 41.5938 51.7890 40.3281 51.7890 36.9297 L 51.7890 18.6719 C 51.7890 17.9688 51.7189 17.4063 51.6018 16.8906 L 29.5938 29.4532 Z");
    			add_location(path, file$d, 26, 9, 851);
    			attr_dev(g2, "id", "SVGRepo_iconCarrier");
    			add_location(g2, file$d, 25, 10, 813);
    			attr_dev(svg, "class", "w-20 h-20 xl:w-48 xl:h-48 fill-warning stroke-warning");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$d, 17, 8, 446);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(17:4) {#if gamePiece === \\\"Cube\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*gamePiece*/ ctx[0] === "Cube") return create_if_block$2;
    		return create_else_block;
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

    			add_location(button, file$d, 10, 0, 193);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", updateGameObject, false, false, false);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function updateGameObject() {
    	console.log("score");
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GamePiece', slots, []);
    	let { gamePiece = "Cube" } = $$props;
    	let { location = "Floor" } = $$props;
    	let coneSVG = "";
    	const writable_props = ['gamePiece', 'location'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<GamePiece> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('gamePiece' in $$props) $$invalidate(0, gamePiece = $$props.gamePiece);
    		if ('location' in $$props) $$invalidate(1, location = $$props.location);
    	};

    	$$self.$capture_state = () => ({
    		gamePiece,
    		location,
    		coneSVG,
    		updateGameObject
    	});

    	$$self.$inject_state = $$props => {
    		if ('gamePiece' in $$props) $$invalidate(0, gamePiece = $$props.gamePiece);
    		if ('location' in $$props) $$invalidate(1, location = $$props.location);
    		if ('coneSVG' in $$props) coneSVG = $$props.coneSVG;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [gamePiece, location];
    }

    class GamePiece extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { gamePiece: 0, location: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GamePiece",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get gamePiece() {
    		throw new Error("<GamePiece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gamePiece(value) {
    		throw new Error("<GamePiece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<GamePiece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<GamePiece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LastStageButton.svelte generated by Svelte v3.49.0 */
    const file$c = "src\\LastStageButton.svelte";

    function create_fragment$d(ctx) {
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
    			attr_dev(path, "d", "M15.75 19.5L8.25 12l7.5-7.5");
    			add_location(path, file$c, 11, 8, 376);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48");
    			add_location(svg, file$c, 10, 4, 178);
    			attr_dev(button, "class", "btn btn-outline w-12 h-28 z-50 xl:h-64 xl:w-24");
    			add_location(button, file$c, 15, 4, 485);
    			attr_dev(div, "class", "flex items-center justify-center ");
    			add_location(div, file$c, 8, 0, 123);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LastStageButton",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\QRButton.svelte generated by Svelte v3.49.0 */
    const file$b = "src\\QRButton.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(path0, file$b, 10, 8, 342);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z");
    			add_location(path1, file$b, 11, 8, 850);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-20 h-20");
    			add_location(svg, file$b, 9, 4, 201);
    			attr_dev(button, "class", "btn btn-outline btn-primary w-48 h-28");
    			add_location(button, file$b, 8, 0, 122);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QRButton",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\GamePieceCombo.svelte generated by Svelte v3.49.0 */
    const file$a = "src\\GamePieceCombo.svelte";

    // (21:30) 
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
    			add_location(div, file$a, 22, 4, 582);
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
    		source: "(21:30) ",
    		ctx
    	});

    	return block;
    }

    // (10:0) {#if type === "normal"}
    function create_if_block$1(ctx) {
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
    			add_location(div0, file$a, 11, 4, 329);
    			attr_dev(div1, "class", "ml-3");
    			add_location(div1, file$a, 14, 4, 404);
    			attr_dev(div2, "class", "ml-3");
    			add_location(div2, file$a, 17, 4, 462);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(10:0) {#if type === \\\"normal\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] === "normal") return 0;
    		if (/*type*/ ctx[0] === "post") return 1;
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GamePieceCombo",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get type() {
    		throw new Error("<GamePieceCombo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<GamePieceCombo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\StartLocationDropdown.svelte generated by Svelte v3.49.0 */

    const file$9 = "src\\StartLocationDropdown.svelte";

    function create_fragment$a(ctx) {
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;

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
    			add_location(option0, file$9, 1, 4, 78);
    			option1.__value = "Long Side";
    			option1.value = option1.__value;
    			add_location(option1, file$9, 2, 4, 143);
    			option2.__value = "Center";
    			option2.value = option2.__value;
    			add_location(option2, file$9, 3, 4, 175);
    			option3.__value = "Short Side";
    			option3.value = option3.__value;
    			add_location(option3, file$9, 4, 4, 204);
    			attr_dev(select, "class", "select select-primary w-64 xl:w-80 text-base xl:text-lg");
    			add_location(select, file$9, 0, 0, 0);
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
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
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

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartLocationDropdown', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StartLocationDropdown> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class StartLocationDropdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartLocationDropdown",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\MobilityBox.svelte generated by Svelte v3.49.0 */

    const file$8 = "src\\MobilityBox.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let label;
    	let span;
    	let t1;
    	let input;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span = element("span");
    			span.textContent = "Mobility";
    			t1 = space();
    			input = element("input");
    			attr_dev(span, "class", "label-text text-sm xl:text-lg");
    			add_location(span, file$8, 2, 8, 112);
    			attr_dev(input, "type", "checkbox");
    			input.checked = "checked";
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$8, 3, 8, 181);
    			attr_dev(label, "class", "cursor-pointer label w-12 flex flex-col content-center");
    			add_location(label, file$8, 1, 4, 32);
    			attr_dev(div, "class", "form-control");
    			add_location(div, file$8, 0, 0, 0);
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
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MobilityBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MobilityBox> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class MobilityBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobilityBox",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\DockedBox.svelte generated by Svelte v3.49.0 */

    const file$7 = "src\\DockedBox.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let label;
    	let span;
    	let t1;
    	let input;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span = element("span");
    			span.textContent = "Docked";
    			t1 = space();
    			input = element("input");
    			attr_dev(span, "class", "label-text text-base xl:text-lg");
    			add_location(span, file$7, 2, 8, 112);
    			attr_dev(input, "type", "checkbox");
    			input.checked = "checked";
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$7, 3, 8, 181);
    			attr_dev(label, "class", "cursor-pointer label w-12 flex flex-col content-center");
    			add_location(label, file$7, 1, 4, 32);
    			attr_dev(div, "class", "form-control");
    			add_location(div, file$7, 0, 0, 0);
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
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DockedBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DockedBox> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class DockedBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DockedBox",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\BalancedBox.svelte generated by Svelte v3.49.0 */

    const file$6 = "src\\BalancedBox.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let label;
    	let span;
    	let t1;
    	let input;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			span = element("span");
    			span.textContent = "Balanced";
    			t1 = space();
    			input = element("input");
    			attr_dev(span, "class", "label-text text-base xl:text-lg");
    			add_location(span, file$6, 2, 8, 112);
    			attr_dev(input, "type", "checkbox");
    			input.checked = "checked";
    			attr_dev(input, "class", "checkbox checkbox-lg checkbox-primary");
    			add_location(input, file$6, 3, 8, 183);
    			attr_dev(label, "class", "cursor-pointer label w-12 flex flex-col content-center");
    			add_location(label, file$6, 1, 4, 32);
    			attr_dev(div, "class", "form-control");
    			add_location(div, file$6, 0, 0, 0);
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
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BalancedBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BalancedBox> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class BalancedBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BalancedBox",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\UndoButton.svelte generated by Svelte v3.49.0 */

    const file$5 = "src\\UndoButton.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3");
    			add_location(path, file$5, 2, 8, 195);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "2.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$5, 1, 4, 56);
    			attr_dev(button, "class", "btn btn-square btn-outline btn-md");
    			add_location(button, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
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

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('UndoButton', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<UndoButton> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class UndoButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UndoButton",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Auto.svelte generated by Svelte v3.49.0 */
    const file$4 = "src\\Auto.svelte";

    function create_fragment$5(ctx) {
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
    			add_location(div0, file$4, 16, 8, 705);
    			attr_dev(div1, "class", "-mt-4 ml-2");
    			add_location(div1, file$4, 19, 8, 783);
    			attr_dev(div2, "class", "flex justify-center");
    			add_location(div2, file$4, 14, 4, 639);
    			attr_dev(div3, "class", "text-3xl mt-7 ");
    			add_location(div3, file$4, 24, 8, 918);
    			attr_dev(div4, "class", "ml-8");
    			add_location(div4, file$4, 27, 8, 990);
    			attr_dev(div5, "class", "ml-16");
    			add_location(div5, file$4, 30, 8, 1060);
    			attr_dev(div6, "class", "text-3xl mt-8 ml-8");
    			add_location(div6, file$4, 33, 8, 1133);
    			attr_dev(div7, "class", "flex justify-center -mt-2");
    			add_location(div7, file$4, 23, 4, 869);
    			attr_dev(div8, "class", "z-20 pt-4 xl:pl-0xl:pl-8 z-10");
    			add_location(div8, file$4, 13, 0, 589);
    			attr_dev(div9, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div9, file$4, 41, 0, 1227);
    			attr_dev(div10, "class", "mt-6");
    			add_location(div10, file$4, 46, 4, 1409);
    			attr_dev(div11, "class", "pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10");
    			add_location(div11, file$4, 45, 0, 1338);
    			add_location(br0, file$4, 51, 0, 1484);
    			add_location(br1, file$4, 51, 4, 1488);
    			add_location(br2, file$4, 51, 8, 1492);
    			add_location(br3, file$4, 51, 12, 1496);
    			set_style(hr, "height", "7px");
    			set_style(hr, "visibility", "hidden");
    			add_location(hr, file$4, 51, 16, 1500);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Auto', slots, []);
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
    		UndoButton
    	});

    	return [];
    }

    class Auto extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Auto",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Tele.svelte generated by Svelte v3.49.0 */
    const file$3 = "src\\Tele.svelte";

    function create_fragment$4(ctx) {
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
    			attr_dev(div0, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div0, file$3, 8, 0, 306);
    			attr_dev(div1, "class", "flex justify-center mr-[320px]");
    			add_location(div1, file$3, 13, 4, 467);
    			attr_dev(div2, "class", "z-20 pt-4 xl:pl-0xl:pl-8 z-10");
    			add_location(div2, file$3, 12, 0, 417);
    			attr_dev(div3, "class", "text-3xl mt-7 ");
    			add_location(div3, file$3, 19, 4, 603);
    			attr_dev(div4, "class", "ml-11");
    			add_location(div4, file$3, 22, 4, 663);
    			attr_dev(div5, "class", "ml-16");
    			add_location(div5, file$3, 25, 4, 722);
    			attr_dev(div6, "class", "text-3xl mt-8 ml-8");
    			add_location(div6, file$3, 28, 4, 783);
    			attr_dev(div7, "class", "flex justify-center -mt-1");
    			add_location(div7, file$3, 18, 0, 558);
    			attr_dev(div8, "class", "mt-6");
    			add_location(div8, file$3, 35, 4, 926);
    			attr_dev(div9, "class", "pl-4 xl:pl-0 -mt-5 xl:pl-8 flex justify-center z-10");
    			add_location(div9, file$3, 34, 0, 855);
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tele",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\StarRating.svelte generated by Svelte v3.49.0 */

    const file$2 = "src\\StarRating.svelte";

    function create_fragment$3(ctx) {
    	let div0;
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

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Test";
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
    			attr_dev(div0, "class", "text-3xl ml-5");
    			add_location(div0, file$2, 1, 0, 2);
    			attr_dev(input0, "type", "radio");
    			attr_dev(input0, "name", "rating-10");
    			attr_dev(input0, "class", "rating-hidden");
    			input0.checked = true;
    			add_location(input0, file$2, 6, 4, 99);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "rating-10");
    			attr_dev(input1, "class", "bg-primary mask mask-star-2 mask-half-1");
    			add_location(input1, file$2, 7, 4, 174);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "rating-10");
    			attr_dev(input2, "class", "bg-primary mask mask-star-2 mask-half-2");
    			add_location(input2, file$2, 8, 4, 267);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "name", "rating-10");
    			attr_dev(input3, "class", "bg-primary mask mask-star-2 mask-half-1");
    			add_location(input3, file$2, 9, 4, 360);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "name", "rating-10");
    			attr_dev(input4, "class", "bg-primary mask mask-star-2 mask-half-2");
    			add_location(input4, file$2, 10, 4, 453);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "name", "rating-10");
    			attr_dev(input5, "class", "bg-primary mask mask-star-2 mask-half-1");
    			add_location(input5, file$2, 11, 4, 546);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "name", "rating-10");
    			attr_dev(input6, "class", "bg-primary mask mask-star-2 mask-half-2");
    			add_location(input6, file$2, 12, 4, 639);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "name", "rating-10");
    			attr_dev(input7, "class", "bg-primary mask mask-star-2 mask-half-1");
    			add_location(input7, file$2, 13, 4, 732);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "name", "rating-10");
    			attr_dev(input8, "class", "bg-primary mask mask-star-2 mask-half-2");
    			add_location(input8, file$2, 14, 4, 825);
    			attr_dev(input9, "type", "radio");
    			attr_dev(input9, "name", "rating-10");
    			attr_dev(input9, "class", "bg-primary mask mask-star-2 mask-half-1");
    			add_location(input9, file$2, 15, 4, 918);
    			attr_dev(input10, "type", "radio");
    			attr_dev(input10, "name", "rating-10");
    			attr_dev(input10, "class", "bg-primary mask mask-star-2 mask-half-2");
    			add_location(input10, file$2, 16, 4, 1011);
    			attr_dev(div1, "class", "rating rating-lg rating-half");
    			add_location(div1, file$2, 5, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input0);
    			append_dev(div1, t2);
    			append_dev(div1, input1);
    			append_dev(div1, t3);
    			append_dev(div1, input2);
    			append_dev(div1, t4);
    			append_dev(div1, input3);
    			append_dev(div1, t5);
    			append_dev(div1, input4);
    			append_dev(div1, t6);
    			append_dev(div1, input5);
    			append_dev(div1, t7);
    			append_dev(div1, input6);
    			append_dev(div1, t8);
    			append_dev(div1, input7);
    			append_dev(div1, t9);
    			append_dev(div1, input8);
    			append_dev(div1, t10);
    			append_dev(div1, input9);
    			append_dev(div1, t11);
    			append_dev(div1, input10);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
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

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StarRating', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StarRating> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class StarRating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StarRating",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\SliderRating.svelte generated by Svelte v3.49.0 */

    const file$1 = "src\\SliderRating.svelte";

    function create_fragment$2(ctx) {
    	let div0;
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

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Test";
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
    			attr_dev(div0, "class", "text-3xl ml-5");
    			add_location(div0, file$1, 0, 0, 0);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "100");
    			input.value = "0";
    			attr_dev(input, "class", "range range-primary");
    			attr_dev(input, "step", "25");
    			add_location(input, file$1, 4, 0, 67);
    			add_location(span0, file$1, 6, 4, 220);
    			add_location(span1, file$1, 7, 4, 241);
    			add_location(span2, file$1, 8, 4, 263);
    			add_location(span3, file$1, 9, 4, 285);
    			add_location(span4, file$1, 10, 4, 307);
    			attr_dev(div1, "class", "w-[270px] flex justify-between text-xs px-2");
    			add_location(div1, file$1, 5, 0, 157);
    			attr_dev(div2, "class", "w-64");
    			add_location(div2, file$1, 3, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
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
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
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

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SliderRating', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SliderRating> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class SliderRating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SliderRating",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Post.svelte generated by Svelte v3.49.0 */
    const file = "src\\Post.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let gamepiececombo;
    	let t0;
    	let div1;
    	let sliderrating;
    	let t1;
    	let starrating;
    	let current;

    	gamepiececombo = new GamePieceCombo({
    			props: { class: "mx-auto", type: "post" },
    			$$inline: true
    		});

    	sliderrating = new SliderRating({ $$inline: true });
    	starrating = new StarRating({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(gamepiececombo.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(sliderrating.$$.fragment);
    			t1 = space();
    			create_component(starrating.$$.fragment);
    			attr_dev(div0, "class", "fixed bottom-0 w-full flex justify-center z-10");
    			add_location(div0, file, 6, 0, 188);
    			attr_dev(div1, "class", "mt-10");
    			add_location(div1, file, 9, 1, 310);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(gamepiececombo, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(sliderrating, div1, null);
    			append_dev(div1, t1);
    			mount_component(starrating, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamepiececombo.$$.fragment, local);
    			transition_in(sliderrating.$$.fragment, local);
    			transition_in(starrating.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamepiececombo.$$.fragment, local);
    			transition_out(sliderrating.$$.fragment, local);
    			transition_out(starrating.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(gamepiececombo);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(sliderrating);
    			destroy_component(starrating);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Post', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ GamePieceCombo, StarRating, SliderRating });
    	return [];
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    // (15:27) 
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
    		source: "(15:27) ",
    		ctx
    	});

    	return block;
    }

    // (13:27) 
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
    		source: "(13:27) ",
    		ctx
    	});

    	return block;
    }

    // (11:27) 
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
    		source: "(11:27) ",
    		ctx
    	});

    	return block;
    }

    // (9:0) {#if $gameStage === 0}
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
    		source: "(9:0) {#if $gameStage === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$gameStage*/ ctx[0] === 0) return 0;
    		if (/*$gameStage*/ ctx[0] === 1) return 1;
    		if (/*$gameStage*/ ctx[0] === 2) return 2;
    		if (/*$gameStage*/ ctx[0] === 3) return 3;
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

    var css_248z = "/*\n! tailwindcss v3.1.7 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 202 100% 33%;\n  --pf: 202 100% 27%;\n  --sf: 45 70% 42%;\n  --af: 224 76% 38%;\n  --nf: 24 14% 5%;\n  --b2: 24 14% 6%;\n  --b3: 24 14% 6%;\n  --bc: 24 12% 81%;\n  --pc: 202 100% 87%;\n  --sc: 45 100% 10%;\n  --ac: 224 100% 90%;\n  --nc: 24 12% 81%;\n  --inc: 198 100% 12%;\n  --suc: 93 100% 12%;\n  --wac: 267 100% 92%;\n  --erc: 356 100% 93%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 45 70% 52%;\n  --a: 224 76% 48%;\n  --n: 24 14% 7%;\n  --b1: 24 14% 7%;\n  --in: 198 93% 60%;\n  --su: 93 78% 60%;\n  --wa: 267 87% 59%;\n  --er: 356 100% 67%;\n}\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::-webkit-backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\r\n.avatar.placeholder > div {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\r\n.badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 1.25rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  width: -webkit-fit-content;\n  width: -moz-fit-content;\n  width: fit-content;\n  padding-left: 0.563rem;\n  padding-right: 0.563rem;\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n  border-radius: var(--rounded-badge, 1.9rem);\n}\r\n.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  -webkit-text-decoration-line: none;\n  text-decoration-line: none;\n  border-width: var(--border-btn, 1px);\n  -webkit-animation: button-pop var(--animation-btn, 0.25s) ease-out;\n          animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn[disabled] {\n  pointer-events: none;\n}\r\n.btn-square {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn.loading, \n    .btn.loading:hover {\n  pointer-events: none;\n}\r\n.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  -webkit-animation: spin 2s linear infinite;\n          animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}\r\n@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    -webkit-animation: spin 10s linear infinite;\n            animation: spin 10s linear infinite;\n  }\n}\r\n@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\r\n.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}\r\n.card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.card:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\r\n.card-body {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  padding: var(--padding-card, 2rem);\n  gap: 0.5rem;\n}\r\n.card-body :where(p) {\n  flex-grow: 1;\n}\r\n.card figure {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\r\n.card.image-full {\n  display: grid;\n}\r\n.card.image-full:before {\n  position: relative;\n  content: \"\";\n  z-index: 10;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  opacity: 0.75;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.card.image-full:before, \n    .card.image-full > * {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\r\n.card.image-full > figure img {\n  height: 100%;\n  -o-object-fit: cover;\n     object-fit: cover;\n}\r\n.card.image-full > .card-body {\n  position: relative;\n  z-index: 20;\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.checkbox {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.form-control {\n  display: flex;\n  flex-direction: column;\n}\r\n.label {\n  display: flex;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  align-items: center;\n  justify-content: space-between;\n  padding-left: 0.25rem;\n  padding-right: 0.25rem;\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n}\r\n.hero {\n  display: grid;\n  width: 100%;\n  place-items: center;\n  background-size: cover;\n  background-position: center;\n}\r\n.hero > * {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\r\n.hero-content {\n  z-index: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  max-width: 80rem;\n  gap: 1rem;\n  padding: 1rem;\n}\r\n.indicator {\n  position: relative;\n  display: inline-flex;\n  width: -webkit-max-content;\n  width: -moz-max-content;\n  width: max-content;\n}\r\n.indicator :where(.indicator-item) {\n  z-index: 1;\n  position: absolute;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.input {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.input-group > .input {\n  isolation: isolate;\n}\r\n.input-group > *, \n  .input-group > .input {\n  border-radius: 0px;\n}\r\n.mask {\n  -webkit-mask-size: contain;\n  mask-size: contain;\n  -webkit-mask-repeat: no-repeat;\n  mask-repeat: no-repeat;\n  -webkit-mask-position: center;\n  mask-position: center;\n}\r\n.mask-half-1 {\n  -webkit-mask-size: 200%;\n  mask-size: 200%;\n  -webkit-mask-position: left;\n  mask-position: left;\n}\r\n.mask-half-2 {\n  -webkit-mask-size: 200%;\n  mask-size: 200%;\n  -webkit-mask-position: right;\n  mask-position: right;\n}\r\n.menu > :where(li.disabled > *:not(ul):focus) {\n  cursor: auto;\n}\r\n.radio {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-radius: 9999px;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  transition: background, box-shadow var(--animation-input, 0.2s) ease-in-out;\n}\r\n.range {\n  height: 1.5rem;\n  width: 100%;\n  cursor: pointer;\n  -webkit-appearance: none;\n  --range-shdw: var(--bc);\n  overflow: hidden;\n  background-color: transparent;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.range:focus {\n  outline: none;\n}\r\n.rating {\n  position: relative;\n  display: inline-flex;\n}\r\n.rating :where(input) {\n  cursor: pointer;\n  -webkit-animation: rating-pop var(--animation-input, 0.25s) ease-out;\n          animation: rating-pop var(--animation-input, 0.25s) ease-out;\n  height: 1.5rem;\n  width: 1.5rem;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 1;\n}\r\n.select {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 2.5rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  min-height: 3rem;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  font-weight: 600;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);\n  background-position: calc(100% - 20px) calc(1px + 50%), calc(100% - 16px) calc(1px + 50%);\n  background-size: 4px 4px, 4px 4px;\n  background-repeat: no-repeat;\n}\r\n.select[multiple] {\n  height: auto;\n}\r\n.steps .step {\n  display: grid;\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n  grid-template-columns: auto;\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n  grid-template-rows: 40px 1fr;\n  place-items: center;\n  text-align: center;\n  min-width: 4rem;\n}\r\n.btn-outline .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  background-color: transparent;\n}\r\n.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--ac) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btm-nav>*.disabled, \n    .btm-nav>*.disabled:hover, \n    .btm-nav>*[disabled], \n    .btm-nav>*[disabled]:hover {\n  pointer-events: none;\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btm-nav>* .label {\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.btn:active:hover,\n  .btn:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}\r\n.btn:hover, \n    .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}\r\n.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\r\n.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-primary:hover, \n    .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}\r\n.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-secondary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-secondary:hover, \n    .btn-secondary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n}\r\n.btn-secondary:focus-visible {\n  outline: 2px solid hsl(var(--s));\n}\r\n.btn-accent {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-accent:hover, \n    .btn-accent.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--af, var(--a)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n}\r\n.btn-accent:focus-visible {\n  outline: 2px solid hsl(var(--a));\n}\r\n.btn-warning {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-warning:hover, \n    .btn-warning.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n}\r\n.btn-warning:focus-visible {\n  outline: 2px solid hsl(var(--wa));\n}\r\n.btn-error {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-error:hover, \n    .btn-error.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n}\r\n.btn-error:focus-visible {\n  outline: 2px solid hsl(var(--er));\n}\r\n.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}\r\n.btn.glass:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}\r\n.btn-outline {\n  border-color: currentColor;\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--b1) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent {\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--af, var(--a)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success {\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--suc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info {\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--in) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--inc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning {\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error {\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn-disabled:hover, \n  .btn[disabled], \n  .btn[disabled]:hover {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btn.loading.btn-square:before, \n    .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}\r\n.btn.loading.btn-xl:before, \n    .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}\r\n.btn.loading.btn-sm:before, \n    .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn, \n  .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:first-of-type) {\n  margin-left: -1px;\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:last-of-type) {\n  border-top-right-radius: 0px;\n  border-bottom-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:first-of-type) {\n  margin-top: -1px;\n  border-top-left-radius: 0px;\n  border-top-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:last-of-type) {\n  border-bottom-right-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n.card:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\r\n.card.bordered {\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n}\r\n.card.compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.checkbox:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.checkbox:checked, \n  .checkbox[checked=\"true\"], \n  .checkbox[aria-checked=true] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(-45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.checkbox:indeterminate {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(-90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(0deg, hsl(var(--chkbg)) 43%, hsl(var(--chkfg)) 43%, hsl(var(--chkfg)) 57%, hsl(var(--chkbg)) 57%);\n}\r\n.checkbox-primary {\n  --chkbg: var(--p);\n  --chkfg: var(--pc);\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.checkbox-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.checkbox-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.checkbox-primary:checked, \n    .checkbox-primary[checked=\"true\"], \n    .checkbox-primary[aria-checked=true] {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.checkbox:disabled {\n  cursor: not-allowed;\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  opacity: 0.2;\n}\r\n@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\nbody[dir=\"rtl\"] .checkbox {\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n}\r\nbody[dir=\"rtl\"] .checkbox:checked,\n    body[dir=\"rtl\"] .checkbox[checked=\"true\"],\n    body[dir=\"rtl\"] .checkbox[aria-checked=true] {\n  background-image: linear-gradient(45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(-45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-secondary {\n  outline: 2px solid hsl(var(--s));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-accent {\n  outline: 2px solid hsl(var(--a));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-warning {\n  outline: 2px solid hsl(var(--wa));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-error {\n  outline: 2px solid hsl(var(--er));\n}\r\n.label-text {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.label a:hover {\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.input[list]::-webkit-calendar-picker-indicator {\n  line-height: 1em;\n}\r\n.input-bordered {\n  --tw-border-opacity: 0.2;\n}\r\n.input:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.input-disabled, \n  .input[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.input-disabled::-moz-placeholder, .input[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.input-disabled::placeholder, \n  .input[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.mask-star-2 {\n  -webkit-mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTkycHgiIGhlaWdodD0iMTgwcHgiIHZpZXdCb3g9IjAgMCAxOTIgMTgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA2MC4xICg4ODEzMykgLSBodHRwczovL3NrZXRjaC5jb20gLS0+CiAgICA8dGl0bGU+c3Rhci0yPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBvbHlnb24gaWQ9InN0YXItMiIgZmlsbD0iIzAwMDAwMCIgcG9pbnRzPSI5NiAxNTMuMDQzNjYxIDM3LjIyMTQ3NDggMTc5LjI4NjUwNiA0NC4yNDExOTA0IDExNS43NzQ0NDQgMC44OTQzNDgzNyA2OC40ODEzNTE1IDY0LjAxMTI5NjUgNTUuNDcxNTgyOCA5NiAwIDEyNy45ODg3MDQgNTUuNDcxNTgyOCAxOTEuMTA1NjUyIDY4LjQ4MTM1MTUgMTQ3Ljc1ODgxIDExNS43NzQ0NDQgMTU0Ljc3ODUyNSAxNzkuMjg2NTA2Ij48L3BvbHlnb24+CiAgICA8L2c+Cjwvc3ZnPg==);\n  mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTkycHgiIGhlaWdodD0iMTgwcHgiIHZpZXdCb3g9IjAgMCAxOTIgMTgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA2MC4xICg4ODEzMykgLSBodHRwczovL3NrZXRjaC5jb20gLS0+CiAgICA8dGl0bGU+c3Rhci0yPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBvbHlnb24gaWQ9InN0YXItMiIgZmlsbD0iIzAwMDAwMCIgcG9pbnRzPSI5NiAxNTMuMDQzNjYxIDM3LjIyMTQ3NDggMTc5LjI4NjUwNiA0NC4yNDExOTA0IDExNS43NzQ0NDQgMC44OTQzNDgzNyA2OC40ODEzNTE1IDY0LjAxMTI5NjUgNTUuNDcxNTgyOCA5NiAwIDEyNy45ODg3MDQgNTUuNDcxNTgyOCAxOTEuMTA1NjUyIDY4LjQ4MTM1MTUgMTQ3Ljc1ODgxIDExNS43NzQ0NDQgMTU0Ljc3ODUyNSAxNzkuMjg2NTA2Ij48L3BvbHlnb24+CiAgICA8L2c+Cjwvc3ZnPg==);\n}\r\n.menu li.disabled > * {\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.menu li.disabled > *:hover {\n  background-color: transparent;\n}\r\n@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n.radio:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.radio:checked, \n  .radio[aria-checked=true] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  -webkit-animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n          animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n  box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n}\r\n.radio:disabled {\n  cursor: not-allowed;\n  opacity: 0.2;\n}\r\n@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n.range:focus-visible::-webkit-slider-thumb {\n  --focus-shadow: 0 0 0 6px hsl(var(--b1)) inset, 0 0 0 2rem hsl(var(--range-shdw)) inset;\n}\r\n.range:focus-visible::-moz-range-thumb {\n  --focus-shadow: 0 0 0 6px hsl(var(--b1)) inset, 0 0 0 2rem hsl(var(--range-shdw)) inset;\n}\r\n.range::-webkit-slider-runnable-track {\n  height: 0.5rem;\n  width: 100%;\n  border-radius: var(--rounded-box, 1rem);\n  background-color: hsla(var(--bc) / 0.1);\n}\r\n.range::-moz-range-track {\n  height: 0.5rem;\n  width: 100%;\n  border-radius: var(--rounded-box, 1rem);\n  background-color: hsla(var(--bc) / 0.1);\n}\r\n.range::-webkit-slider-thumb {\n  background-color: hsl(var(--b1));\n  position: relative;\n  height: 1.5rem;\n  width: 1.5rem;\n  border-style: none;\n  border-radius: var(--rounded-box, 1rem);\n  -webkit-appearance: none;\n  top: 50%;\n  color: hsl(var(--range-shdw));\n  transform: translateY(-50%);\n  --filler-size: 100rem;\n  --filler-offset: 0.6rem;\n  box-shadow: 0 0 0 3px hsl(var(--range-shdw)) inset, var(--focus-shadow, 0 0), calc(var(--filler-size) * -1 - var(--filler-offset)) 0 0 var(--filler-size);\n}\r\n.range::-moz-range-thumb {\n  background-color: hsl(var(--b1));\n  position: relative;\n  height: 1.5rem;\n  width: 1.5rem;\n  border-style: none;\n  border-radius: var(--rounded-box, 1rem);\n  top: 50%;\n  color: hsl(var(--range-shdw));\n  --filler-size: 100rem;\n  --filler-offset: 0.5rem;\n  box-shadow: 0 0 0 3px hsl(var(--range-shdw)) inset, var(--focus-shadow, 0 0), calc(var(--filler-size) * -1 - var(--filler-offset)) 0 0 var(--filler-size);\n}\r\n.range-primary {\n  --range-shdw: var(--p);\n}\r\n.range-secondary {\n  --range-shdw: var(--s);\n}\r\n.rating input {\n  -moz-appearance: none;\n       appearance: none;\n  -webkit-appearance: none;\n}\r\n.rating .rating-hidden {\n  width: 0.5rem;\n  background-color: transparent;\n}\r\n.rating input:checked ~ input, \n  .rating input[aria-checked=true] ~ input {\n  --tw-bg-opacity: 0.2;\n}\r\n.rating input:focus-visible {\n  transition-property: transform;\n  transition-duration: 300ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transform: translateY(-0.125em);\n}\r\n.rating input:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: translateY(-0.125em);\n}\r\n.rating-half :where(input:not(.rating-hidden)) {\n  width: 0.75rem;\n}\r\n@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n.select:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.select-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.select-primary:focus {\n  outline: 2px solid hsl(var(--p));\n}\r\n.select-disabled, \n  .select[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.select-disabled::-moz-placeholder, .select[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.select-disabled::placeholder, \n  .select[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.select-multiple, \n  .select[multiple], \n  .select[size].select:not([size=\"1\"]) {\n  background-image: none;\n  padding-right: 1rem;\n}\r\n.steps .step:before {\n  top: 0px;\n  grid-column-start: 1;\n  grid-row-start: 1;\n  height: 0.5rem;\n  width: 100%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  content: \"\";\n  margin-left: -100%;\n}\r\n.steps .step:after {\n  content: counter(step);\n  counter-increment: step;\n  z-index: 1;\n  position: relative;\n  grid-column-start: 1;\n  grid-row-start: 1;\n  display: grid;\n  height: 2rem;\n  width: 2rem;\n  place-items: center;\n  place-self: center;\n  border-radius: 9999px;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.steps .step:first-child:before {\n  content: none;\n}\r\n.steps .step[data-content]:after {\n  content: attr(data-content);\n}\r\n@-webkit-keyframes toast-pop {\n\n  0% {\n    transform: scale(0.9);\n    opacity: 0;\n  }\n\n  100% {\n    transform: scale(1);\n    opacity: 1;\n  }\n}\r\n@keyframes toast-pop {\n\n  0% {\n    transform: scale(0.9);\n    opacity: 0;\n  }\n\n  100% {\n    transform: scale(1);\n    opacity: 1;\n  }\n}\r\n.btn-sm {\n  height: 2rem;\n  padding-left: 0.75rem;\n  padding-right: 0.75rem;\n  min-height: 2rem;\n  font-size: 0.875rem;\n}\r\n.btn-md {\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  min-height: 3rem;\n  font-size: 0.875rem;\n}\r\n.btn-square:where(.btn-xs) {\n  height: 1.5rem;\n  width: 1.5rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-sm) {\n  height: 2rem;\n  width: 2rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-lg) {\n  height: 4rem;\n  width: 4rem;\n  padding: 0px;\n}\r\n.btn-circle:where(.btn-sm) {\n  height: 2rem;\n  width: 2rem;\n  border-radius: 9999px;\n  padding: 0px;\n}\r\n.btn-circle:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  border-radius: 9999px;\n  padding: 0px;\n}\r\n.checkbox-lg {\n  height: 2rem;\n  width: 2rem;\n}\r\n.indicator :where(.indicator-item) {\n  right: 0px;\n  left: auto;\n  top: 0px;\n  bottom: auto;\n  --tw-translate-x: 50%;\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-start) {\n  right: auto;\n  left: 0px;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-center) {\n  right: 50%;\n  left: 50%;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-end) {\n  right: 0px;\n  left: auto;\n  --tw-translate-x: 50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-bottom) {\n  top: auto;\n  bottom: 0px;\n  --tw-translate-y: 50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-middle) {\n  top: 50%;\n  bottom: 50%;\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.indicator :where(.indicator-item.indicator-top) {\n  top: 0px;\n  bottom: auto;\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.rating-lg input {\n  height: 2.5rem;\n  width: 2.5rem;\n}\r\n.rating-half.rating-xs input:not(.rating-hidden) {\n  width: 0.375rem;\n}\r\n.rating-half.rating-sm input:not(.rating-hidden) {\n  width: 0.5rem;\n}\r\n.rating-half.rating-md input:not(.rating-hidden) {\n  width: 0.75rem;\n}\r\n.rating-half.rating-lg input:not(.rating-hidden) {\n  width: 1.25rem;\n}\r\n.steps-horizontal .step {\n  display: grid;\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n  place-items: center;\n  text-align: center;\n}\r\n.steps-vertical .step {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  grid-template-rows: repeat(1, minmax(0, 1fr));\n}\r\n.badge-secondary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.badge-warning {\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.badge-outline.badge-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.badge-outline.badge-warning {\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.card-compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.card-normal .card-body {\n  padding: var(--padding-card, 2rem);\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.steps-horizontal .step {\n  grid-template-rows: 40px 1fr;\n  grid-template-columns: auto;\n  min-width: 4rem;\n}\r\n.steps-horizontal .step:before {\n  height: 0.5rem;\n  width: 100%;\n  --tw-translate-y: 0px;\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  content: \"\";\n  margin-left: -100%;\n}\r\n.steps-vertical .step {\n  gap: 0.5rem;\n  grid-template-columns: 40px 1fr;\n  grid-template-rows: auto;\n  min-height: 4rem;\n  justify-items: start;\n}\r\n.steps-vertical .step:before {\n  height: 100%;\n  width: 0.5rem;\n  --tw-translate-y: -50%;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  margin-left: 50%;\n}\r\n.fixed {\n  position: fixed;\n}\r\n.absolute {\n  position: absolute;\n}\r\n.bottom-0 {\n  bottom: 0px;\n}\r\n.z-20 {\n  z-index: 20;\n}\r\n.z-10 {\n  z-index: 10;\n}\r\n.z-50 {\n  z-index: 50;\n}\r\n.mx-auto {\n  margin-left: auto;\n  margin-right: auto;\n}\r\n.-mt-4 {\n  margin-top: -1rem;\n}\r\n.ml-4 {\n  margin-left: 1rem;\n}\r\n.-mt-2 {\n  margin-top: -0.5rem;\n}\r\n.ml-16 {\n  margin-left: 4rem;\n}\r\n.-mt-5 {\n  margin-top: -1.25rem;\n}\r\n.mt-6 {\n  margin-top: 1.5rem;\n}\r\n.ml-3 {\n  margin-left: 0.75rem;\n}\r\n.mb-2 {\n  margin-bottom: 0.5rem;\n}\r\n.mr-2 {\n  margin-right: 0.5rem;\n}\r\n.-ml-3 {\n  margin-left: -0.75rem;\n}\r\n.mt-12 {\n  margin-top: 3rem;\n}\r\n.mt-16 {\n  margin-top: 4rem;\n}\r\n.mt-20 {\n  margin-top: 5rem;\n}\r\n.mt-24 {\n  margin-top: 6rem;\n}\r\n.mt-28 {\n  margin-top: 7rem;\n}\r\n.mt-32 {\n  margin-top: 8rem;\n}\r\n.mt-\\[115px\\] {\n  margin-top: 115px;\n}\r\n.mt-\\[116px\\] {\n  margin-top: 116px;\n}\r\n.mt-5 {\n  margin-top: 1.25rem;\n}\r\n.mt-8 {\n  margin-top: 2rem;\n}\r\n.mt-7 {\n  margin-top: 1.75rem;\n}\r\n.mr-6 {\n  margin-right: 1.5rem;\n}\r\n.-ml-4 {\n  margin-left: -1rem;\n}\r\n.-ml-8 {\n  margin-left: -2rem;\n}\r\n.ml-7 {\n  margin-left: 1.75rem;\n}\r\n.ml-8 {\n  margin-left: 2rem;\n}\r\n.ml-2 {\n  margin-left: 0.5rem;\n}\r\n.mr-64 {\n  margin-right: 16rem;\n}\r\n.mr-72 {\n  margin-right: 18rem;\n}\r\n.mr-\\[300px\\] {\n  margin-right: 300px;\n}\r\n.mr-\\[320px\\] {\n  margin-right: 320px;\n}\r\n.mt-\\[56px\\] {\n  margin-top: 56px;\n}\r\n.mt-\\[50px\\] {\n  margin-top: 50px;\n}\r\n.mt-\\[46px\\] {\n  margin-top: 46px;\n}\r\n.mt-\\[48px\\] {\n  margin-top: 48px;\n}\r\n.ml-32 {\n  margin-left: 8rem;\n}\r\n.ml-64 {\n  margin-left: 16rem;\n}\r\n.ml-56 {\n  margin-left: 14rem;\n}\r\n.mt-10 {\n  margin-top: 2.5rem;\n}\r\n.mt-9 {\n  margin-top: 2.25rem;\n}\r\n.mt-\\[30px\\] {\n  margin-top: 30px;\n}\r\n.mt-\\[5px\\] {\n  margin-top: 5px;\n}\r\n.-mt-7 {\n  margin-top: -1.75rem;\n}\r\n.-mt-6 {\n  margin-top: -1.5rem;\n}\r\n.-mt-1 {\n  margin-top: -0.25rem;\n}\r\n.-mt-3 {\n  margin-top: -0.75rem;\n}\r\n.ml-9 {\n  margin-left: 2.25rem;\n}\r\n.ml-10 {\n  margin-left: 2.5rem;\n}\r\n.ml-11 {\n  margin-left: 2.75rem;\n}\r\n.ml-12 {\n  margin-left: 3rem;\n}\r\n.ml-5 {\n  margin-left: 1.25rem;\n}\r\n.-ml-1 {\n  margin-left: -0.25rem;\n}\r\n.-ml-10 {\n  margin-left: -2.5rem;\n}\r\n.-ml-2 {\n  margin-left: -0.5rem;\n}\r\n.ml-1 {\n  margin-left: 0.25rem;\n}\r\n.flex {\n  display: flex;\n}\r\n.h-28 {\n  height: 7rem;\n}\r\n.h-20 {\n  height: 5rem;\n}\r\n.h-16 {\n  height: 4rem;\n}\r\n.h-24 {\n  height: 6rem;\n}\r\n.h-6 {\n  height: 1.5rem;\n}\r\n.min-h-screen {\n  min-height: 100vh;\n}\r\n.w-full {\n  width: 100%;\n}\r\n.w-12 {\n  width: 3rem;\n}\r\n.w-28 {\n  width: 7rem;\n}\r\n.w-20 {\n  width: 5rem;\n}\r\n.w-16 {\n  width: 4rem;\n}\r\n.w-24 {\n  width: 6rem;\n}\r\n.w-64 {\n  width: 16rem;\n}\r\n.w-6 {\n  width: 1.5rem;\n}\r\n.w-48 {\n  width: 12rem;\n}\r\n.w-1\\/2 {\n  width: 50%;\n}\r\n.w-5 {\n  width: 1.25rem;\n}\r\n.w-56 {\n  width: 14rem;\n}\r\n.w-72 {\n  width: 18rem;\n}\r\n.w-\\[270px\\] {\n  width: 270px;\n}\r\n.max-w-sm {\n  max-width: 24rem;\n}\r\n.flex-shrink-0 {\n  flex-shrink: 0;\n}\r\n.transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.cursor-pointer {\n  cursor: pointer;\n}\r\n.flex-col {\n  flex-direction: column;\n}\r\n.content-center {\n  align-content: center;\n}\r\n.items-center {\n  align-items: center;\n}\r\n.justify-center {\n  justify-content: center;\n}\r\n.justify-between {\n  justify-content: space-between;\n}\r\n.rounded-md {\n  border-radius: 0.375rem;\n}\r\n.bg-base-100 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n}\r\n.bg-base-200 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n}\r\n.bg-green-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(34 197 94 / var(--tw-bg-opacity));\n}\r\n.bg-primary {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n}\r\n.bg-info {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--in) / var(--tw-bg-opacity));\n}\r\n.fill-warning {\n  fill: hsl(var(--wa));\n}\r\n.fill-secondary {\n  fill: hsl(var(--s));\n}\r\n.fill-base-100 {\n  fill: hsl(var(--b1));\n}\r\n.stroke-warning {\n  stroke: hsl(var(--wa));\n}\r\n.stroke-secondary {\n  stroke: hsl(var(--s));\n}\r\n.p-2 {\n  padding: 0.5rem;\n}\r\n.p-5 {\n  padding: 1.25rem;\n}\r\n.py-6 {\n  padding-top: 1.5rem;\n  padding-bottom: 1.5rem;\n}\r\n.px-2 {\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n}\r\n.pt-4 {\n  padding-top: 1rem;\n}\r\n.pl-4 {\n  padding-left: 1rem;\n}\r\n.text-center {\n  text-align: center;\n}\r\n.text-base {\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.text-5xl {\n  font-size: 3rem;\n  line-height: 1;\n}\r\n.text-xl {\n  font-size: 1.25rem;\n  line-height: 1.75rem;\n}\r\n.text-lg {\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n}\r\n.text-2xl {\n  font-size: 1.5rem;\n  line-height: 2rem;\n}\r\n.text-3xl {\n  font-size: 1.875rem;\n  line-height: 2.25rem;\n}\r\n.text-sm {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.text-xs {\n  font-size: 0.75rem;\n  line-height: 1rem;\n}\r\n.font-bold {\n  font-weight: 700;\n}\r\n.shadow-2xl {\n  --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);\n  --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\r\n/*My hatred for CSS is present in the emptiness of this file*/\r\n@media (min-width: 1024px) {\n\n  .lg\\:flex-row-reverse {\n    flex-direction: row-reverse;\n  }\n\n  .lg\\:text-left {\n    text-align: left;\n  }\n}\r\n@media (min-width: 1280px) {\n\n  .xl\\:mb-4 {\n    margin-bottom: 1rem;\n  }\n\n  .xl\\:ml-4 {\n    margin-left: 1rem;\n  }\n\n  .xl\\:h-64 {\n    height: 16rem;\n  }\n\n  .xl\\:h-48 {\n    height: 12rem;\n  }\n\n  .xl\\:h-8 {\n    height: 2rem;\n  }\n\n  .xl\\:h-36 {\n    height: 9rem;\n  }\n\n  .xl\\:h-24 {\n    height: 6rem;\n  }\n\n  .xl\\:w-64 {\n    width: 16rem;\n  }\n\n  .xl\\:w-48 {\n    width: 12rem;\n  }\n\n  .xl\\:w-28 {\n    width: 7rem;\n  }\n\n  .xl\\:w-24 {\n    width: 6rem;\n  }\n\n  .xl\\:w-12 {\n    width: 3rem;\n  }\n\n  .xl\\:w-36 {\n    width: 9rem;\n  }\n\n  .xl\\:w-80 {\n    width: 20rem;\n  }\n\n  .xl\\:p-10 {\n    padding: 2.5rem;\n  }\n\n  .xl\\:pl-0 {\n    padding-left: 0px;\n  }\n\n  .xl\\:pl-8 {\n    padding-left: 2rem;\n  }\n\n  .xl\\:text-lg {\n    font-size: 1.125rem;\n    line-height: 1.75rem;\n  }\n\n  .xl\\:text-2xl {\n    font-size: 1.5rem;\n    line-height: 2rem;\n  }\n\n  .xl\\:text-3xl {\n    font-size: 1.875rem;\n    line-height: 2.25rem;\n  }\n}\r\n\r\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
