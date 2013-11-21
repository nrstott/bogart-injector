var Dict = require('collections/dict');

var REGEX = {
  FUNCTION_DECLARATION: /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
  FUNCTION_ARG: /^\s*(_?)(\S+?)\1\s*$/,
  ARGS_SEPERATOR: /,/,
  COMMENTS: /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
};

function removeComments(fnText) {
  return fnText.replace(REGEX.COMMENTS, '');
}

function getArgs(fnText) {
  var args = fnText.match(REGEX.FUNCTION_DECLARATION);

  if (args && args.length) {
    args = args[1].split(REGEX.ARGS_SEPERATOR)
      .filter(function (arg) {
        return arg && arg.length;
      })
      .map(function (arg) {
        return arg.trim();
      });
  } else {
    args = [];
  }

  return args;
}

function annotate(fn) {
  var names = [];

  var fnText = removeComments(fn.toString());
  var args = getArgs(fnText);
  
  return args;
}

function Injector(parent) {
  return Object.create(Injector.prototype, {
    providers: {
      value: new Dict()
    },
    parent: {
      value: parent,
      enumerable: true
    }
  });
}

Injector.annotate = annotate;

Injector.prototype.instantiate = function (Type, locals) {
  var Constructor = function () {};
  Constructor.prototype = Type.prototype;

  var instance = new Constructor();

  var rv = this.invoke(Type, instance, locals);
  if (rv !== null && rv !== undefined) {
    return rv;
  }

  return instance;
};

Injector.prototype.invoke = function (fn, context, locals) {
  var self = this;
  var dependencyNames = annotate(fn);

  var args = dependencyNames.map(function (name) {
    return locals && locals.hasOwnProperty(name) ?
      locals[name] : self.resolve(name);
  });

  return fn.apply(context, args);
};

/**
 * Resolves a dependency by name.
 *
 * @param {String} name Name of the dependency.
 */
Injector.prototype.resolve = function (name) {
  var provider = this.providers.get(name);
  if (provider === undefined) {
    return this.parent.resolve(name);
  }

  return this.invoke(provider.$get);
};

/**
 * Queries if a service exists.
 *
 * @param {String} name Name of the service.
 * @returns {boolean} `true` if injector has given service; `false` if it does not.
 */
Injector.prototype.has = function (name) {
  return this.providers.has(name);
};

/**
 * Registers a provider.
 *
 * @param {Object} provider Provider to register.
 * @see injector:Provider
 * @returns {Injector} The Injector for puposes of chaining.
 */
Injector.prototype.provider = function (name, provider) {
  this.providers.set(name, provider);

  return this;
};

/**
 * Registers a factory.
 *
 * @param {String} name Name of the dependency supplied by the factory.
 * @returns {Injector} The Injector for purposes of chaining.
 */
Injector.prototype.factory = function (name, factory) {
  var provider = {
    $get: factory
  };
  
  this.providers.set(name, provider);

  return this;
};

/**
 * Registers a service.
 *
 * @param {String} name Name of the service.
 * @param {Constructor} Service Constructor for service.
 * @returns {Injector} The injector for chaining.
 */
Injector.prototype.service = function (name, Service) {
  var self = this;

  var provider = {
    $get: function () {
      return self.instantiate(Service);
    }
  };

  this.providers.set(name, provider);

  return this;
};

Injector.prototype.createChild = function () {
  return new Injector(this);
};

module.exports = Injector;
