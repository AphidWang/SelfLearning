// import ReactGA from 'react-ga4';

let initialized = false;

// export const initGA = () => {
//   ReactGA.initialize('G-XXXXXXXXXX');
// };

// export const logPageView = () => {
//   ReactGA.send({ hitType: "pageview", page: window.location.pathname });
// };

// export const logEvent = (category: string, action: string, label?: string) => {
//   ReactGA.event({
//     category,
//     action,
//     label
//   });
// };

export const initGA = (): void => {
  const id = import.meta.env.VITE_GA_ID;
  if (id && !initialized) {
    // ReactGA.initialize(id);
    initialized = true;
  }
};

export const trackPageView = (path: string): void => {
  if (!initialized) initGA();
  // ReactGA.send({ hitType: 'pageview', page: path });
};

export const trackEvent = (
  action: string,
  category: string,
  label?: string
): void => {
  if (!initialized) initGA();
  // ReactGA.event({ action, category, label });
};
