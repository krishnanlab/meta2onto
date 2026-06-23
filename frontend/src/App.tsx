import "@/styles.css";
import "@fontsource-variable/sometype-mono";
import "@fontsource-variable/outfit";
import { useEffect } from "react";
import analytics from "react-ga4";
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
import Help from "@/pages/Help";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Stats from "@/pages/Stats";
import Studies from "@/pages/Studies";
import Terms from "@/pages/Terms";
import Testbed from "@/pages/Testbed";
import { scrollTo } from "@/util/dom";

/** app entrypoint */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

/** route layout */
function Layout() {
  /** current route info */
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    scrollTo(hash);
  }, [hash]);

  /** track analytics page view */
  useEffect(() => {
    analytics.send({
      hitType: "pageview",
      page: pathname + search + hash,
      title: document.title,
    });
  }, [pathname, search, hash]);

  return (
    <>
      <Header />
      <main>
        <Outlet />
        <Stats />
      </main>
      <Footer />
    </>
  );
}

/** route definitions */
const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          /** handle 404 redirect (see 404.html) */

          /** load redirect storage items */
          const redirectPath = window.sessionStorage.redirectPath || "";
          const redirectState = JSON.parse(
            window.sessionStorage.redirectState || "null",
          );

          /** remove redirect storage items right after consuming */
          window.sessionStorage.removeItem("redirectPath");
          window.sessionStorage.removeItem("redirectState");

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
        path: "studies/:search?",
        element: <Studies />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "help",
        element: <Help />,
      },
      {
        path: "cart/:id?",
        element: <Cart />,
      },
      {
        path: "terms",
        element: <Terms />,
      },

      {
        path: "testbed",
        element: <Testbed />,
      },

      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

/** router */
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

/** network request client */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (retry) => 200 * retry,
      staleTime: Infinity,
    },
    mutations: { retry: 2, retryDelay: (retry) => 200 * retry },
  },
});
