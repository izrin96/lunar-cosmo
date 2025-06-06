"use client";

import { authClient } from "@/lib/auth-client";
import React, { useState } from "react";
import { Avatar, buttonStyles, Menu, Link, Loader } from "./ui";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/lib/server/db/schema";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  DiscordLogoIcon,
  SignOutIcon,
  UserIcon,
  HeartIcon,
  GearSixIcon,
  PlusIcon,
  DeviceMobileIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { GenerateDiscordFormatModal } from "./list/modal/generate-discord";
import { CreateListModal } from "./list/modal/manage-list";
import UserAccountModal from "@/components/auth/account/user-account";

export default function UserNav() {
  // temporary fix for ui being stuck after navigate
  const pathname = usePathname();
  const { data, isPending } = authClient.useSession();

  if (isPending) return;

  return (
    <div className="text-sm gap-2 inline-flex">
      {data ? (
        <UserMenu key={pathname} user={data.user as User} />
      ) : (
        <>
          <Link
            href="/login"
            className={buttonStyles({ intent: "outline", size: "small" })}
          >
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}

function UserMenu({ user }: { user: User }) {
  const [genOpen, setGenOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <GenerateDiscordFormatModal open={genOpen} setOpen={setGenOpen} />
      <UserAccountModal open={accountOpen} setOpen={setAccountOpen} />
      <CreateListModal open={createListOpen} setOpen={setCreateListOpen} />

      <Menu respectScreen={false}>
        <Menu.Trigger aria-label="Open Menu">
          <Avatar
            alt={user.name}
            initials={user.name.charAt(0)}
            size="medium"
            shape="square"
            src={user.image}
          />
        </Menu.Trigger>
        <Menu.Content
          respectScreen={false}
          placement="bottom right"
          className="sm:min-w-56"
        >
          <Menu.Section>
            <Menu.Header separator>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <div className="flex gap-2">
                  {user.discord && (
                    <span className="font-normal text-muted-fg inline-flex gap-1">
                      {user.discord}
                      <DiscordLogoIcon
                        size={16}
                        weight="regular"
                        className="self-center"
                      />
                    </span>
                  )}
                  {user.twitter && (
                    <span className="font-normal text-muted-fg inline-flex gap-1">
                      {user.twitter}
                      <XLogoIcon
                        size={16}
                        weight="regular"
                        className="self-center"
                      />
                    </span>
                  )}
                </div>
              </div>
            </Menu.Header>
          </Menu.Section>

          <MyListMenuItem
            openCreateList={() => setCreateListOpen(true)}
            openDiscordFormat={() => setGenOpen(true)}
          />

          <MyCosmoProfileMenuItem />

          <Menu.Item onAction={() => setAccountOpen(true)}>
            <UserIcon data-slot="icon" />
            <Menu.Label>Account</Menu.Label>
          </Menu.Item>

          <Menu.Separator />

          <Menu.Item
            onAction={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    toast.success("Sign out successful");
                    router.refresh();
                  },
                },
              });
            }}
          >
            <SignOutIcon data-slot="icon" />
            <Menu.Label>Sign out</Menu.Label>
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </>
  );
}

function MyListMenuItem({
  openCreateList,
  openDiscordFormat,
}: {
  openCreateList: () => void;
  openDiscordFormat: () => void;
}) {
  const { data, isLoading } = api.list.myList.useQuery();
  const items = data ?? [];
  return (
    <Menu.Submenu>
      <Menu.Item>
        <HeartIcon data-slot="icon" />
        <Menu.Label>My List</Menu.Label>
      </Menu.Item>
      <Menu.Content placement="left top">
        {isLoading && (
          <Menu.Item isDisabled>
            <Menu.Label>
              <Loader variant="ring" />
            </Menu.Label>
          </Menu.Item>
        )}
        {!isLoading && items.length === 0 && (
          <Menu.Item isDisabled>
            <Menu.Label>
              <span>No list found</span>
            </Menu.Label>
          </Menu.Item>
        )}
        {items.map((a) => (
          <Menu.Item key={a.slug} href={`/list/${a.slug}`}>
            <Menu.Label>{a.name}</Menu.Label>
          </Menu.Item>
        ))}
        <Menu.Item onAction={openCreateList}>
          <PlusIcon data-slot="icon" />
          <Menu.Label>Create list</Menu.Label>
        </Menu.Item>
        <Menu.Item onAction={openDiscordFormat}>
          <DiscordLogoIcon data-slot="icon" />
          <Menu.Label>Discord Format</Menu.Label>
        </Menu.Item>
        <Menu.Item href={`/list`}>
          <GearSixIcon data-slot="icon" />
          <Menu.Label>Manage list</Menu.Label>
        </Menu.Item>
      </Menu.Content>
    </Menu.Submenu>
  );
}

function MyCosmoProfileMenuItem() {
  const { data, isLoading } = api.profile.getAll.useQuery();
  const items = data ?? [];
  return (
    <Menu.Submenu>
      <Menu.Item>
        <DeviceMobileIcon data-slot="icon" />
        <Menu.Label>My Cosmo Link</Menu.Label>
      </Menu.Item>
      <Menu.Content placement="left top">
        {isLoading && (
          <Menu.Item isDisabled>
            <Menu.Label>
              <Loader variant="ring" />
            </Menu.Label>
          </Menu.Item>
        )}
        {!isLoading && items.length === 0 && (
          <Menu.Item isDisabled>
            <Menu.Label>
              <span>No Cosmo found</span>
            </Menu.Label>
          </Menu.Item>
        )}
        {items.map((a) => (
          <Menu.Item key={a.address} href={`/@${a.nickname}`}>
            <Menu.Label>{a.nickname}</Menu.Label>
          </Menu.Item>
        ))}
        <Menu.Item href={`/link`}>
          <GearSixIcon data-slot="icon" />
          <Menu.Label>Manage Cosmo link</Menu.Label>
        </Menu.Item>
      </Menu.Content>
    </Menu.Submenu>
  );
}
