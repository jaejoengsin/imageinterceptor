

export let permissionForMasking = true;
export let isInterceptorActive = true;

function setPermissionForMasking(flag) { permissionForMasking = flag; }
function setInterceptorActive(flag) { isInterceptorActive = flag; }
function getInterceptorActive() { return isInterceptorActive; }
function getPermissionForMasking() { return permissionForMasking; }

export { setPermissionForMasking, setInterceptorActive, getInterceptorActive, getPermissionForMasking };