function lerp(t, a, b) {
    return a + t * ( b - a );
}
function norm(t, a, b) {
    return ( t - a ) / ( b - a );
}
function map(t, a0, b0, a1, b1) {
    return lerp(norm(t, a0, b0), a1, b1);
}
