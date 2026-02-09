"use client";

import CouponRevealModal from "@/components/CouponRevealModal";

type Props = {
  code?: string;
  title?: string;
  storeName?: string;
  storeLogo?: string;
  redirect?: string;
  storeId?: string;
  expiry?: string;
  isCode?: boolean;
  trending?: boolean;
  returnUrl?: string;
};

export default function CouponRevealClient(props: Props) {
  return <CouponRevealModal {...props} blurBackdrop />;
}
