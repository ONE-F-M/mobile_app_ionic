export const serviceRouteMap = {
  "Checkin Checkout": "/checkin",
  "Leaves": "/leaves",
  "New Leave Application": "/leaves/add",
  "Pay Slips": "/payslip",
  "Employee Resignation": "/resignation",
  "Resignation Withdrawal": "/resignation/withdraw",
  "Resignation Extension": "/resignation/extend",
  "Advances": "/advance",
  "Letters": "/letter",
  // WI-002301: keyed on the App Service name the backend creates - rename either and
  // the tile silently falls back to /service.
  "Uniform Request": "/uniform-request"
};

// Static allow-list of the routes registered in src/router/index.js. A service
// is only shown (and only navigable) when its mapped route is listed here.
// When a screen for Pay Slips / Advances / Letters is added, register the route
// in the router AND add its path here (tests/unit/serviceRouteMap.spec.js fails
// if this list names a path the router does not register).
// router.hasRoute is not used because most routes in the router are unnamed.
export const REGISTERED_SERVICE_ROUTES = [
  "/checkin",
  "/leaves",
  "/leaves/add",
  "/resignation",
  "/resignation/withdraw",
  "/resignation/extend",
  "/uniform-request",
];

// Returns the route for a service, or null when the service has no mapping or
// its route is not registered (callers must skip null -- no tile, no navigation).
export const getServiceRoute = (service) => {
  const route = serviceRouteMap[service];
  return route && REGISTERED_SERVICE_ROUTES.includes(route) ? route : null;
};

// Withdrawal and Extension are actions reached from inside Employee
// Resignation, not standalone features -- they should never appear as their
// own entry anywhere a user picks/manages services (home screen, Manage
// Services), only "Employee Resignation" should.
export const RESIGNATION_SUB_SERVICES = ["Resignation Withdrawal", "Resignation Extension"];
