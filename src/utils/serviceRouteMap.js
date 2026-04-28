export const serviceRouteMap = {
  "Checkin Checkout": "/checkin",
  "Leaves": "/leaves",
  "New Leave Application": "/leaves/add",
  "Pay Slips": "/payslip",
  "Employee Resignation": "/resignation",
  "Resignation Withdrawal": "/resignation/withdraw",
  "Advances": "/advance",
  "Letters": "/letter"
};

export const getServiceRoute = (service) => {
  return serviceRouteMap[service] || "/service";
};
