import React from "react";
import Socials from "../Socials";
import Link from "next/link";
import Button from "../Button";

const Footer = ({}) => {
  return (
    <>
      <div className="mt-5 laptop:mt-40 p-2 laptop:p-0">
        <div>
          <h1 className="text-2xl text-bold">Contact.</h1>
          <div className="mt-10">
            <h1 className="text-3xl tablet:text-6xl laptop:text-6xl laptopl:text-8xl text-bold">
              LET&apos;S WORK
            </h1>
            <h1 className="text-3xl tablet:text-6xl laptop:text-6xl laptopl:text-8xl text-bold">
              TOGETHER
            </h1>
            <Button type="primary">Schedule a call</Button>
            <div className="mt-10">
              <Socials />
            </div>
          </div>
        </div>
      </div>
      <h1 className="text-sm text-bold mt-2 laptop:mt-10 p-2 laptop:p-0">
        Made With ❤ by{" "}
        <Link href="https://linktr.ee/akshatgandhi?fbclid=PAZXh0bgNhZW0CMTEAAabSJyR7yW0le_4hKVT08CBUQ97vvgCzbPqIogm4K_341FDk0kAhRhgx3Wc_aem_RXtDMsviIdTrG9ljnrMMcA">
          <a className="underline underline-offset-1">Akshat Gandhi</a>
        </Link>
      </h1>
    </>
  );
};

export default Footer;
