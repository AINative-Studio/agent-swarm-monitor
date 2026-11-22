import '@testing-library/jest-dom';

// jsdom doesn't implement the Pointer Events APIs Radix UI's Select/Dialog
// primitives call during pointer-driven interactions (hasPointerCapture,
// setPointerCapture/releasePointerCapture are entirely absent from jsdom's
// HTMLElement). Without these, @testing-library/user-event's click() on a
// Radix trigger throws "target.hasPointerCapture is not a function",
// failing every test that opens a Select/Dialog via user-event.
if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
}

// jsdom also doesn't implement scrollIntoView, which Radix Select calls
// when scrolling the viewport to a selected/focused option.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
}

// jsdom doesn't implement ResizeObserver, which Radix UI's Switch (and other
// size-aware primitives) use via @radix-ui/react-use-size to measure the
// thumb. Without this, mounting a Switch throws "ResizeObserver is not
// defined" during the layout-effect phase.
if (typeof globalThis.ResizeObserver === 'undefined') {
    class ResizeObserverPolyfill {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverPolyfill;
}
