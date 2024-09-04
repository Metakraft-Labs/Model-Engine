//stackoverflow.com/a/54335525
export function* sequence(start, end, step = 1) {
    let state = start;
    while (state < end) {
        yield state;
        state += step;
    }
    return;
}
