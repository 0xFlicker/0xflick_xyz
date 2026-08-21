import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AssistantWorkspace } from "@/features/assistant/AssistantWorkspace";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

describe("Assistant media input", () => {
  it("sends the selected image once and keeps later turns text-only", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAssistantRepository();
    const fake = createFakeModelAdapter({ capabilities: { image: true } });
    render(
      <AssistantWorkspace adapter={fake.adapter} repository={repository} />,
    );

    const input = await screen.findByLabelText("Message the local assistant");
    const imageInput = screen.getByLabelText("Choose media attachments");
    expect(imageInput).toHaveAttribute("accept", "image/*");
    const file = new File([new Uint8Array([1, 2, 3])], "diagram.png", { type: "image/png" });
    await user.upload(imageInput, file);
    expect(await screen.findByText("diagram.png")).toBeVisible();

    await user.type(input, "What is this?{enter}");
    expect(await screen.findByText("A local response.")).toBeVisible();
    const mediaPrompt = fake.capturedInputs.find(
      (value) =>
        Array.isArray(value) &&
        value.some(
          (prompt) =>
            Array.isArray(prompt.content) &&
            prompt.content.some((part) => part.type === "image"),
        ),
    );
    expect(mediaPrompt).toBeDefined();

    await user.type(screen.getByLabelText("Message the local assistant"), "Follow up{enter}");
    await screen.findAllByText("A local response.");
    const lastInput = fake.capturedInputs[fake.capturedInputs.length - 1];
    expect(JSON.stringify(lastInput)).not.toContain("image");
    const conversation = await repository.getConversation(
      (await repository.getSessions()).activeSessionId!,
    );
    expect(conversation?.mediaRepresentations).toHaveLength(1);
  });
});
