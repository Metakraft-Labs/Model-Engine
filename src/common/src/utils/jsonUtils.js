Object.defineProperty(BigInt.prototype, "toJSON", {
    get() {
        return () => String(this);
    },
});
