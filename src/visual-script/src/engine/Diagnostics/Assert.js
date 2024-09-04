export class Assert {
    static mustEqual(value, mustEqualThisValue, msg = "") {
        if (value !== mustEqualThisValue) {
            throw new Error(`failed assertion: ${value} must equal ${mustEqualThisValue}.  ${msg}`);
        }
    }
    static mustBeTrue(condition, msg = "") {
        if (!condition) {
            throw new Error(`failed assertion: ${msg}`);
        }
    }
    static mustBeDefined(variable, msg = "") {
        if (variable === undefined) {
            throw new Error(`failed assertion: variable must be defined ${msg}`);
        }
    }
}
