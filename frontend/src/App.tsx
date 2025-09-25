import {
  createBrowserRouter,
  Outlet,
  redirect,
  RouterProvider,
} from "react-router";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import About from "@/pages/About";
import { Home } from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import { redirectPath, redirectState } from "@/util/url";

/** app entrypoint */
const App = () => <RouterProvider router={router} />;

export default App;

/** route layout */
const Layout = () => (
  <>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

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
        path: "about",
        element: <About />,
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
