"use client";

import { useObjektSelect } from "@/hooks/use-objekt-select";
import { api } from "@/lib/trpc/client";
import { Suspense, useRef } from "react";
import { toast } from "sonner";
import {
  Button,
  Checkbox,
  Form,
  Link,
  Loader,
  Modal,
  Note,
  Select,
} from "../../ui";
import ErrorFallbackRender from "../../error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

type AddToListModalProps = {
  open: boolean;
  setOpen: (val: boolean) => void;
};

export function AddToListModal({ open, setOpen }: AddToListModalProps) {
  const formRef = useRef<HTMLFormElement>(null!);
  const selected = useObjektSelect((a) => a.selected);
  const reset = useObjektSelect((a) => a.reset);
  const addToList = api.list.addObjektsToList.useMutation({
    onSuccess: (rowCount) => {
      setOpen(false);
      reset();
      toast.success(`${rowCount} objekt added to the list`, {
        duration: 1300,
      });
    },
    onError: () => {
      toast.error("Error adding objekt to list");
    },
  });
  return (
    <Modal.Content isOpen={open} onOpenChange={setOpen}>
      <Modal.Header>
        <Modal.Title>Add to list</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          ref={formRef}
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addToList.mutate({
              slug: formData.get("slug") as string,
              skipDups: formData.get("skipDups") === "on",
              collectionSlugs: selected.map((a) => a.slug),
            });
          }}
        >
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                FallbackComponent={ErrorFallbackRender}
              >
                <Suspense
                  fallback={
                    <div className="flex justify-center">
                      <Loader variant="ring" />
                    </div>
                  }
                >
                  <AddToListForm />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Close>Cancel</Modal.Close>
        <Button
          type="submit"
          isPending={addToList.isPending}
          onClick={() => formRef.current.requestSubmit()}
        >
          Add
        </Button>
      </Modal.Footer>
    </Modal.Content>
  );
}

function AddToListForm() {
  const [data] = api.list.myList.useSuspenseQuery();

  if (data.length === 0)
    return (
      <Note intent="default">
        You don&apos;t have any list yet.{" "}
        <Link className="underline" href="/list">
          Create one here
        </Link>
        .
      </Note>
    );

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="My List"
        placeholder="Select a list"
        name="slug"
        isRequired
      >
        <Select.Trigger />
        <Select.List items={data}>
          {(item) => (
            <Select.Option id={item.slug} textValue={item.slug}>
              {item.name}
            </Select.Option>
          )}
        </Select.List>
      </Select>
      <Checkbox
        defaultSelected={true}
        name="skipDups"
        label="Prevent duplicate"
        description="Skip the same objekt when adding"
      />
    </div>
  );
}

type RemoveFromListModalProps = {
  slug: string;
  open: boolean;
  setOpen: (val: boolean) => void;
};

export function RemoveFromListModal({
  slug,
  open,
  setOpen,
}: RemoveFromListModalProps) {
  const selected = useObjektSelect((a) => a.selected);
  const reset = useObjektSelect((a) => a.reset);
  const utils = api.useUtils();
  const removeObjektsFromList = api.list.removeObjektsFromList.useMutation({
    onSuccess: () => {
      setOpen(false);
      reset();
      utils.list.getEntries.invalidate(slug);
      toast.success("Objekt removed from the list", {
        duration: 1300,
      });
    },
    onError: () => {
      toast.error("Error removing objekt from list");
    },
  });
  return (
    <Modal.Content isOpen={open} onOpenChange={setOpen}>
      <Modal.Header>
        <Modal.Title>Remove objekt</Modal.Title>
        <Modal.Description>
          This will permanently remove the selected objekt from the list.
          Continue?
        </Modal.Description>
      </Modal.Header>
      <Modal.Footer>
        <Modal.Close>Cancel</Modal.Close>
        <Form
          onSubmit={async (e) => {
            e.preventDefault();
            removeObjektsFromList.mutate({
              slug: slug.toString(),
              ids: selected.map((a) => Number(a.id)),
            });
          }}
        >
          <Button
            intent="danger"
            type="submit"
            isPending={removeObjektsFromList.isPending}
          >
            Continue
          </Button>
        </Form>
      </Modal.Footer>
    </Modal.Content>
  );
}
