import {
  createBrowserRouter,
  Outlet,
  redirect,
  RouterProvider,
  useLocation,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import About from "@/pages/About";
import Cart from "@/pages/Cart";
import { Home } from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Search from "@/pages/Search";
import { getDocBbox, glow, scrollTo } from "@/util/dom";
import { useChanged } from "@/util/hooks";
import { sleep, waitFor, waitForStable } from "@/util/misc";
import { redirectPath, redirectState } from "@/util/url";

/** app entrypoint */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);

export default App;

/** route layout */
const Layout = () => {
  /** current route info */
  const { hash, pathname, search } = useLocation();

  /** which parts of route have changed from prev render */
  const hashChanged = useChanged(hash);
  const restChanged = useChanged({ pathname, search });

  scrollToHash(hash, hashChanged, restChanged);

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

/** route definitions */
export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          /** handle 404 redirect */
          if (redirectState !== null)
            window.history.replaceState(redirectState, "");
          if (redirectPath) {
            console.debug("Redirecting to:", redirectPath);
            console.debug("With state:", redirectState);
            return redirect(redirectPath);
          } else return null;
        },
      },
      {
        path: "search/:search?",
        element: <Search />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "cart/:id?",
        element: <Cart />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

/** router */
export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

/** network request client */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 } },
});

/** scroll to target of url hash on page */
const scrollToHash = async (
  hash: string,
  hashChanged: boolean,
  restChanged: boolean,
) => {
  if (!hash) return;
  if (!hashChanged) return;

  /** wait for element to appear */
  const element = await waitFor(() => document.querySelector(hash));
  if (!element) return;

  /**
   * if not just hash changed (indicating we may be on first load of page or
   * otherwise expecting significant layout changes)
   */
  if (restChanged) {
    /** wait for layout shifts to stabilize */
    await waitForStable(() => getDocBbox(element).top);
    /** scroll down a bit to trigger small header */
    window.scrollBy(0, 100);
    await sleep();
  }

  /** scroll to element */
  scrollTo(hash);

  /** highlight element */
  glow(element);
};
