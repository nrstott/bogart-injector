
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

    describe('given function with one argument', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(function (foo) { return foo(); });
      });

      it('should have length of 1', function () {
        expect(dependencies.length).toBe(1);
      })
    });

    describe('given function with arguments', function () {
      var dependencies;

      beforeEach(function () {
        dependencies = Injector.annotate(function (foo, bar) { return foo(bar()); });
      });

      it('should have length of 2', function () {
        expect(dependencies.length).toBe(2);
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

    var injector, factoryRv, myFoo;

    beforeEach(function () {
      injector = new Injector();

      factoryRv = injector.factory('foo', function () {
        return {
          foo: 'bar'
        };
      });

      myFoo = injector.resolve('foo');
    });

    it('should be defined', function () {
      expect(myFoo).not.toBe(undefined);
    });

    it('should return injector', function () {
      expect(factoryRv).toBe(injector);
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

});

