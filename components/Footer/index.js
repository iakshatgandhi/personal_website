import React, { useState } from "react";
import Socials from "../Socials";
import Link from "next/link";
import Button from "../Button";
import ScheduleCall from "./scheduleCall";

const Footer = () => {
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <>
      <div className="mt-5 laptop:mt-40 p-2 laptop:p-0">
        <div>
          <h1 className="text-2xl text-bold">Contact</h1>
          <div className="mt-5">
            <h1 className="text-3xl tablet:text-6xl laptop:text-6xl laptopl:text-8xl text-bold">
              LET&apos;S WORK
            </h1>
            <h1 className="text-3xl tablet:text-6xl laptop:text-6xl laptopl:text-8xl text-bold">
              TOGETHER
            </h1>
            <Button
              type="primary"
              onClick={() => setShowScheduleModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-black/80 to-black/90 text-white rounded-lg 
           hover:from-black/60 hover:to-black/80 transition-all duration-200"
            >
              Schedule a call
            </Button>
            <div className="mt-5">
              <Socials />
            </div>
          </div>
        </div>
      </div>
      {showSchedule && <ScheduleCall onClose={() => setShowSchedule(false)} />}
      <h1 className="text-sm font-bold mt-2 laptop:mt-10 p-2 laptop:p-0">
        Made With ❤ by{" "}
        <Link href="https://linktr.ee/akshatgandhi?fbclid=PAZXh0bgNhZW0CMTEAAabSJyR7yW0le_4hKVT08CBUQ97vvgCzbPqIogm4K_341FDk0kAhRhgx3Wc_aem_RXtDMsviIdTrG9ljnrMMcA">
          <a className="underline underline-offset-1">Akshat Gandhi</a>
        </Link>
      </h1>
    </>
  );
};

export default Footer;
