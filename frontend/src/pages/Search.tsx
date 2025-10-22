import { useParams } from "react-router";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";

export const Search = () => {
  const { search } = useParams<{ search: string }>();

  const title = `Search for "${search}"`;

  return (
    <>
      <Meta title={title} />

      <section className="bg-light">
        <Heading level={1}>"{search}"</Heading>
      </section>

      <section></section>
    </>
  );
};

export default Search;
