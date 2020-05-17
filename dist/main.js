
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function () {
    'use strict';

    function noop() {}

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

    function text(data) {
    	return document.createTextNode(data);
    }

    function space() {
    	return text(' ');
    }

    function listen(node, event, handler, options) {
    	node.addEventListener(event, handler, options);
    	return () => node.removeEventListener(event, handler, options);
    }

    function attr(node, attribute, value) {
    	if (value == null) node.removeAttribute(attribute);
    	else node.setAttribute(attribute, value);
    }

    function children(element) {
    	return Array.from(element.childNodes);
    }

    let current_component;

    function set_current_component(component) {
    	current_component = component;
    }

    const dirty_components = [];

    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];

    function schedule_update() {
    	if (!update_scheduled) {
    		update_scheduled = true;
    		resolved_promise.then(flush);
    	}
    }

    function add_render_callback(fn) {
    	render_callbacks.push(fn);
    }

    function flush() {
    	const seen_callbacks = new Set();

    	do {
    		// first, call beforeUpdate functions
    		// and update components
    		while (dirty_components.length) {
    			const component = dirty_components.shift();
    			set_current_component(component);
    			update(component.$$);
    		}

    		while (binding_callbacks.length) binding_callbacks.shift()();

    		// then, once components are updated, call
    		// afterUpdate functions. This may cause
    		// subsequent updates...
    		while (render_callbacks.length) {
    			const callback = render_callbacks.pop();
    			if (!seen_callbacks.has(callback)) {
    				callback();

    				// ...so guard against infinite loops
    				seen_callbacks.add(callback);
    			}
    		}
    	} while (dirty_components.length);

    	while (flush_callbacks.length) {
    		flush_callbacks.pop()();
    	}

    	update_scheduled = false;
    }

    function update($$) {
    	if ($$.fragment) {
    		$$.update($$.dirty);
    		run_all($$.before_render);
    		$$.fragment.p($$.dirty, $$.ctx);
    		$$.dirty = null;

    		$$.after_render.forEach(add_render_callback);
    	}
    }

    function mount_component(component, target, anchor) {
    	const { fragment, on_mount, on_destroy, after_render } = component.$$;

    	fragment.m(target, anchor);

    	// onMount happens after the initial afterUpdate. Because
    	// afterUpdate callbacks happen in reverse order (inner first)
    	// we schedule onMount callbacks before afterUpdate callbacks
    	add_render_callback(() => {
    		const new_on_destroy = on_mount.map(run).filter(is_function);
    		if (on_destroy) {
    			on_destroy.push(...new_on_destroy);
    		} else {
    			// Edge case - component was destroyed immediately,
    			// most likely as a result of a binding initialising
    			run_all(new_on_destroy);
    		}
    		component.$$.on_mount = [];
    	});

    	after_render.forEach(add_render_callback);
    }

    function destroy(component, detaching) {
    	if (component.$$) {
    		run_all(component.$$.on_destroy);
    		component.$$.fragment.d(detaching);

    		// TODO null out other refs, including component.$$ (but need to
    		// preserve final state?)
    		component.$$.on_destroy = component.$$.fragment = null;
    		component.$$.ctx = {};
    	}
    }

    function make_dirty(component, key) {
    	if (!component.$$.dirty) {
    		dirty_components.push(component);
    		schedule_update();
    		component.$$.dirty = blank_object();
    	}
    	component.$$.dirty[key] = true;
    }

    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
    	const parent_component = current_component;
    	set_current_component(component);

    	const props = options.props || {};

    	const $$ = component.$$ = {
    		fragment: null,
    		ctx: null,

    		// state
    		props: prop_names,
    		update: noop,
    		not_equal: not_equal$$1,
    		bound: blank_object(),

    		// lifecycle
    		on_mount: [],
    		on_destroy: [],
    		before_render: [],
    		after_render: [],
    		context: new Map(parent_component ? parent_component.$$.context : []),

    		// everything else
    		callbacks: blank_object(),
    		dirty: null
    	};

    	let ready = false;

    	$$.ctx = instance
    		? instance(component, props, (key, value) => {
    			if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
    				if ($$.bound[key]) $$.bound[key](value);
    				if (ready) make_dirty(component, key);
    			}
    		})
    		: props;

    	$$.update();
    	ready = true;
    	run_all($$.before_render);
    	$$.fragment = create_fragment($$.ctx);

    	if (options.target) {
    		if (options.hydrate) {
    			$$.fragment.l(children(options.target));
    		} else {
    			$$.fragment.c();
    		}

    		if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
    		mount_component(component, options.target, options.anchor);
    		flush();
    	}

    	set_current_component(parent_component);
    }

    class SvelteComponent {
    	$destroy() {
    		destroy(this, true);
    		this.$destroy = noop;
    	}

    	$on(type, callback) {
    		const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
    		callbacks.push(callback);

    		return () => {
    			const index = callbacks.indexOf(callback);
    			if (index !== -1) callbacks.splice(index, 1);
    		};
    	}

    	$set() {
    		// overridden by instance, if it has props
    	}
    }

    class SvelteComponentDev extends SvelteComponent {
    	constructor(options) {
    		if (!options || (!options.target && !options.$$inline)) {
    			throw new Error(`'target' is a required option`);
    		}

    		super();
    	}

    	$destroy() {
    		super.$destroy();
    		this.$destroy = () => {
    			console.warn(`Component was already destroyed`); // eslint-disable-line no-console
    		};
    	}
    }

    /* src/components/Login.svelte generated by Svelte v3.4.0 */

    const file = "src/components/Login.svelte";

    // (42:4) {#if isSignup}
    function create_if_block(ctx) {
    	var div, label, t1, input, t2, p;

    	return {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			label.textContent = "Re-enter Password";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			p = element("p");
    			p.textContent = "Please enter a password.";
    			label.className = "block mb-2 text-sm font-bold text-gray-700";
    			label.htmlFor = "password";
    			add_location(label, file, 43, 6, 1315);
    			input.className = "w-full px-3 py-2 mb-3 leading-tight text-gray-700 border rounded-full shadow appearance-none focus:outline-none focus:shadow-outline";
    			input.id = "password";
    			attr(input, "type", "password");
    			input.placeholder = "******************";
    			add_location(input, file, 47, 6, 1472);
    			p.className = "text-xs italic text-red-500";
    			add_location(p, file, 48, 6, 1690);
    			div.className = "mb-6";
    			add_location(div, file, 42, 4, 1290);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(div, t1);
    			append(div, input);
    			append(div, t2);
    			append(div, p);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div4, form, div0, label0, t1, input0, t2, div1, label1, t4, input1, t5, p0, t7, t8, div3, div2, button, t10, a, t12, p1, dispose;

    	var if_block = (ctx.isSignup) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div4 = element("div");
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Username";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			p0 = element("p");
    			p0.textContent = "Please enter a password.";
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Sign In";
    			t10 = space();
    			a = element("a");
    			a.textContent = "Create Account";
    			t12 = space();
    			p1 = element("p");
    			p1.textContent = "©2020 doer Corp. All rights reserved.";
    			label0.className = "block mb-2 text-sm font-bold text-gray-700";
    			label0.htmlFor = "username";
    			add_location(label0, file, 27, 6, 453);
    			input0.className = "w-full px-3 py-2 leading-tight text-gray-700 border rounded-full shadow appearance-none focus:outline-none focus:shadow-outline";
    			input0.id = "username";
    			attr(input0, "type", "text");
    			input0.placeholder = "Username";
    			add_location(input0, file, 30, 6, 565);
    			div0.className = "mb-4";
    			add_location(div0, file, 26, 4, 428);
    			label1.className = "block mb-2 text-sm font-bold text-gray-700";
    			label1.htmlFor = "password";
    			add_location(label1, file, 34, 6, 821);
    			input1.className = "w-full px-3 py-2 mb-3 leading-tight text-gray-700 border rounded-full shadow appearance-none focus:outline-none focus:shadow-outline";
    			input1.id = "password";
    			attr(input1, "type", "password");
    			input1.placeholder = "******************";
    			add_location(input1, file, 38, 6, 970);
    			p0.className = "text-xs italic text-red-500";
    			add_location(p0, file, 39, 6, 1188);
    			div1.className = "mb-6";
    			add_location(div1, file, 33, 4, 796);
    			button.className = "w-full px-4 py-2 mb-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline svelte-1ckmlb1";
    			button.type = "button";
    			add_location(button, file, 53, 6, 1865);
    			a.className = "inline-block text-sm font-bold text-blue-500 align-baseline hover:text-blue-800";
    			a.href = "#/";
    			add_location(a, file, 56, 6, 2078);
    			div2.className = "w-full";
    			add_location(div2, file, 52, 4, 1838);
    			div3.className = "flex items-center justify-between";
    			add_location(div3, file, 51, 4, 1786);
    			form.className = "px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md svelte-1ckmlb1";
    			add_location(form, file, 24, 2, 361);
    			p1.className = "text-xs text-center text-gray-500";
    			add_location(p1, file, 64, 2, 2268);
    			div4.className = "w-full max-w-sm mx-auto mt-64";
    			add_location(div4, file, 22, 0, 314);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(button, "click", login),
    				listen(a, "click", ctx.signUp)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, form);
    			append(form, div0);
    			append(div0, label0);
    			append(div0, t1);
    			append(div0, input0);

    			input0.value = ctx.username;

    			append(form, t2);
    			append(form, div1);
    			append(div1, label1);
    			append(div1, t4);
    			append(div1, input1);
    			append(div1, t5);
    			append(div1, p0);
    			append(form, t7);
    			if (if_block) if_block.m(form, null);
    			append(form, t8);
    			append(form, div3);
    			append(div3, div2);
    			append(div2, button);
    			append(div2, t10);
    			append(div2, a);
    			append(div4, t12);
    			append(div4, p1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.username && (input0.value !== ctx.username)) input0.value = ctx.username;

    			if (ctx.isSignup) {
    				if (!if_block) {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(form, t8);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}

    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function login(){

    }

    function instance($$self, $$props, $$invalidate) {
    	let username='';
    let isPasswordMatch=false;
    let isSignup=false;
    isPasswordMatch=true; $$invalidate('isPasswordMatch', isPasswordMatch);

    function signUp() {
        var $$result = isSignup=!isSignup; $$invalidate('isSignup', isSignup); return $$result;
    }

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate('username', username);
    	}

    	return {
    		username,
    		isSignup,
    		signUp,
    		input0_input_handler
    	};
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.4.0 */

    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	var main, current;

    	var login = new Login({ $$inline: true });

    	return {
    		c: function create() {
    			main = element("main");
    			login.$$.fragment.c();
    			main.className = "mx-auto mt-20";
    			add_location(main, file$1, 7, 0, 149);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(login, main, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			login.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			login.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			login.$destroy();
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
        target: document.body
    });

}());
//# sourceMappingURL=main.js.map
