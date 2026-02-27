import "@/styles.css";
import "@fontsource-variable/sometype-mono";
import "@fontsource-variable/outfit";
import { useEffect } from "react";
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
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Search from "@/pages/Search";
import Stats from "@/pages/Stats";
import Testbed from "@/pages/Testbed";
import { scrollTo } from "@/util/dom";
import { redirectPath, redirectState } from "@/util/url";

/** app entrypoint */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

/** route layout */
const Layout = () => {
  /** current route info */
  const { hash } = useLocation();

  useEffect(() => {
    scrollTo(hash);
  }, [hash]);

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
};

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
