import { H1 } from "@/components/Heading";
import Meta from "@/components/Meta";

export default function NotFound() {
  return (
    <>
      <Meta title="Not Found" />

      <section>
        <H1>Not Found</H1>

        <p>The page you're looking for doesn't exist!</p>
      </section>
    </>
  );
}
