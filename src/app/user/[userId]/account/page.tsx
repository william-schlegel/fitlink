import { getUserById } from "@/server/api/routers/users";
import { getTranslations } from "next-intl/server";
import FormAccount from "./formAccount";

export default async function Account({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";

  const userData = await getUserById(myUserId, {
    withImage: false,
    withMemberData: false,
  });
  const t = await getTranslations("auth");

  // const userQuery = trpc.users.getUserById.useQuery(myUserId, {
  //   enabled: isCUID(myUserId),
  //   onSuccess: (data) => {
  //     reset({
  //       searchAddress: data?.coachData?.searchAddress ?? "",
  //       longitude: data?.coachData?.longitude ?? LONGITUDE,
  //       latitude: data?.coachData?.latitude ?? LATITUDE,
  //       internalRole: data?.internalRole ?? Role.MEMBER,
  //       range: data?.coachData?.range ?? 10,
  //       description: data?.coachData?.description ?? "",
  //       aboutMe: data?.coachData?.aboutMe ?? "",
  //       publicName: data?.coachData?.publicName ?? "",
  //       coachingActivities: data?.coachData?.coachingActivities.map(
  //         (a) => a.name
  //       ),
  //       pricingId: "",
  //       monthlyPayment: true,
  //       cancelationDate: null,
  //     });
  //   },
  // });

  // const utils = trpc.useContext();
  // const updateUser = trpc.users.updateUser.useMutation({
  //   onSuccess() {
  //     utils.users.getUserById.invalidate(myUserId);
  //     toast.success(t("user-updated"));
  //   },
  //   onError(error) {
  //     toast.error(error.message);
  //   },
  // });
  // const  t  = useTranslations("auth");

  return (
    <div
      // title={t("account.your-account")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <div className="flex items-center justify-between">
        <h1>{t("account.your-account")}</h1>
        {/* <Modal
          title={t("account.payments")}
          buttonIcon={<i className="bx bx-euro bx-sm" />}
          variant="Secondary"
        >
          <h3>{t("account.payments")}</h3>
        </Modal> */}
      </div>
      <FormAccount userData={userData} />
    </div>
  );
}
