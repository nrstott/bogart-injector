
var Injector = require('../lib/injector');

describe('Injector', function () {

  describe ('annotate', function () {

    describe('given function with no arguments', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(function () { return true; });
      });

      it('should have length of 0', function () {
        expect(dependencies.length).toBe(0);
      });
    });

    describe('given lambda with no arguments', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(() => { return true; });
      });

      it('should have length of 0', function () {
        expect(dependencies.length).toBe(0);
      });
    });

    describe('given function with one argument', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(function (foo) { return foo(); });
      });

      it('should have length of 1', function () {
        expect(dependencies.length).toBe(1);
      });

      it('should have correct dependency', function () {
        expect(dependencies[0]).toBe('foo');
      });
    });

    describe('given lambda with one argument', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(foo => { return foo(); })
      });

      it('should have length 1', function () {
        expect(dependencies.length).toBe(1);
      });

      it('should have correct dependency', function () {
        expect(dependencies[0]).toBe('foo');
      });
      
      it('should have correct dependency', function () {
        expect(dependencies[0]).toBe('foo');
      });
    });

    describe('given function with arguments', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(function (foo, bar) { return foo(bar()); });
      });

      it('should have length of 2', function () {
        expect(dependencies.length).toBe(2);
      });

      it('should have foo dependency', function () {
        expect(dependencies[0]).toBe('foo');
      });

      it('should have bar dependency', function () {
        expect(dependencies[1]).toBe('bar');
      });
    });

    describe('given lambda with arguments', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate((foo, bar) => { return foo(bar()); });
      });

      it('should have length of 2', function () {
        expect(dependencies.length).toBe(2);
      });

      it('should have foo dependency', function () {
        expect(dependencies[0]).toBe('foo');
      });

      it('should have bar dependency', function () {
        expect(dependencies[1]).toBe('bar');
      });
    });

    describe('given method', function () {
      class Foo {
        bar(baz) {
          return 'baz';
        }
      }

      beforeEach(function () {
        dependencies = Injector.annotate(new Foo().bar);
      })

      it('should have length of 1', function () {
        expect(dependencies.length).toBe(1);
      });

      it('should have dependency named `baz`', function () {
        expect(dependencies[0]).toBe('baz');
      });
    });
  });
  
  describe('given a provider', function () {

    var injector, myProvider;

    beforeEach(function () {
      injector = new Injector();

      injector.provider('myProvider', {
        $get: function () {
          return {
            foo: 'bar'
          };
        }
      });

      myProvider = injector.resolve('myProvider');
    });

    it('should be defined', function () {
      expect(myProvider).not.toBe(undefined);
    });

    it('should have correct value for `foo`', function () {
      expect(myProvider.foo).toBe('bar');
    });
  });

  describe('given a provider with dependencies in its $get', function () {

    var injector, myFoo, myBar;

    beforeEach(function () {
      injector = new Injector();

      injector.provider('myFoo', {
        $get: function (myBar) {
          return {
            bar: myBar
          };
        }
      });

      injector.provider('myBar', {
        $get: function () {
          return 'bar';
        }
      });

      myFoo = injector.resolve('myFoo');
    });

    it('should be defined', function () {
      expect(myFoo).not.toBe(undefined);
    });

    it('should have correct value for `bar`', function () {
      expect(myFoo.bar).toBe('bar');
    });

    it('should "have" myFoo', function () {
      expect(injector.has('myFoo')).toBe(true);
    });

    it('should "have" myBar', function () {
      expect(injector.has('myBar')).toBe(true);
    });
  });

  describe('given a factory', function () {

    var injector, factoryFn, factoryRv, myFoo;

    beforeEach(function () {
      injector = new Injector();

      factoryFn = jasmine.createSpy('factory function');
      factoryFn.andReturn({ foo: 'bar' });

      factoryRv = injector.factory('foo', factoryFn);

      myFoo = injector.resolve('foo');
    });

    it('should be defined', function () {
      expect(myFoo).not.toBe(undefined);
    });

    it('should return injector', function () {
      expect(factoryRv).toBe(injector);
    });

    it('should invoke factory function', function () {
      injector.invoke(test);

      expect(factoryFn).toHaveBeenCalled();

      function test(foo) {
        return foo;
      }
    });
  });

  describe('given a service', function () {
    var injector, serviceRv, myFoo;

    beforeEach(function () {
      injector = new Injector();

      serviceRv = injector.service('foo', Foo);

      myFoo = injector.resolve('foo');
    });

    it('should be instanceof Foo', function () {
      expect(myFoo instanceof Foo).toBe(true);
    });

    it('should return self from Injector#service', function () {
      expect(serviceRv).toBe(injector);
    });

    it('should invoke with instance of service', function () {
      expect(injector.invoke(test) instanceof Foo).toBe(true);

      function test(foo) {
        return foo;
      }
    });

    function Foo() {
      this.foo = 'bar';
    }
  });

  describe('given a service with dependencies', function () {
    var injector, myFoo, myBar;

    beforeEach(function () {
      injector = new Injector();

      injector
        .service('foo', Foo)
        .service('bar', Bar);

      myFoo = injector.resolve('foo');
    });

    it('should be instanceof Foo', function () {
      expect(myFoo instanceof Foo).toBe(true);
    });

    it('should have dependency correct value for foo', function () {
      expect(myFoo.foo).toEqual({ bar: 'baz' });
    });

    function Foo(bar) {
      this.foo = bar;
    }

    function Bar() {
      this.bar = 'baz';
    }
  });

  describe('given a value', function () {
    var injector, resolvedFoo;

    beforeEach(function () {
      injector = new Injector();

      injector.value('foo', 'bar');

      resolvedFoo = injector.resolve('foo');
    });

    it('should resolve correct value', function () {
      expect(resolvedFoo).toBe('bar');
    });
  });

  describe('creating a child injector', function () {
    var parent, child;

    beforeEach(function () {
      parent = new Injector();
      child = parent.createChild();
    });

    it('should be instanceof Injector', function () {
      expect(child instanceof Injector).toBe(true);
    });

    describe('given dependency in parent', function () {
      beforeEach(function () {
        parent.factory('foo', function () {
          return 'foo';
        });
      });

      it('should resolve from child', function () {
        expect(child.resolve('foo')).toBe('foo');
      });
    });
  });

  describe('invoke array', function () {
    var dependencyNames, callback, fooValue, barValue, result, callbackReturn, invokeArray;

    beforeEach(function () {
      dependencyNames = [ 'foo', 'bar' ];

      callbackReturn = '__callback return value__';

      callback = function () {
        return callbackReturn;
      };

      fooValue = 'abc123';
      barValue = 'xyz321';

      var injector = new Injector();
      injector.value('foo', fooValue);
      injector.value('bar', barValue);

      invokeArray = dependencyNames.concat([ callback ])
      result = injector.invoke(invokeArray);
    });

    it('should have correct result', function () {
      expect(result).toBe(callbackReturn);
    });

    it('should not destroy array', function () {
      expect(invokeArray.length).toBe(3);
    });
  });
});

