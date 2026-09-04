export const serviceRouteMap = {
  "Checkin Checkout": "/checkin",
  "Leaves": "/leaves",
  "New Leave Application": "/leaves/add",
  "Pay Slips": "/payslip",
  "Employee Resignation": "/resignation",
  "Resignation Withdrawal": "/resignation/withdraw",
  "Advances": "/advance",
  "Letters": "/letter",
  // WI-002301: keyed on the App Service name the backend creates - rename either and
  // the tile silently falls back to /service.
  "Uniform Request": "/uniform-request"
};

export const getServiceRoute = (service) => {
  return serviceRouteMap[service] || "/service";
};
