<script lang="ts">
  type FormData = {
    projectName: string;
    client: string;
    meetingDate: string;
    stakeholders: string;
    documentType: string;
    otherDocType: string;
    primaryAudience: string;
    knowledgeLevel: string[];
    specificRoles: string[];
    otherRole: string;
    priorKnowledge: string;
    primaryObjective: string;
    problemSolved: string;
    keyTakeaways: string[];
    successMetrics: string[];
    otherMetric: string;
    formatRequirements: string[];
    otherFormat: string;
    lengthGuidelines: {
      wordCount: string;
      sections: string;
      constraints: string;
    };
    toneStyle: string[];
    otherTone: string;
    requiredElements: string[];
    otherElement: string;
    sections: Array<{ title: string; points: string[] }>;
    specialRequirements: string;
    technicalRequirements: string[];
    otherTechnical: string;
    platformRequirements: string;
    versionConsiderations: string;
    examples: string[];
    referenceTypes: string[];
    otherReference: string;
    referenceLinks: string[];
    deliverables: string[];
    otherDeliverable: string;
    timeline: {
      firstDraft: string;
      reviewPeriod: string;
      finalDelivery: string;
    };
    reviewProcess: string[];
    criticalRequirements: string[];
    qualityStandards: string[];
    otherQuality: string;
    signoffRequirements: string[];
    otherSignoff: string;
    constraints: string;
    risks: string;
    questions: string[];
  };

  let formData: FormData = {
    projectName: '', client: '', meetingDate: '', stakeholders: '',
    documentType: '', otherDocType: '', primaryAudience: '',
    knowledgeLevel: [], specificRoles: [], otherRole: '',
    priorKnowledge: '', primaryObjective: '', problemSolved: '',
    keyTakeaways: [''], successMetrics: [], otherMetric: '',
    formatRequirements: [], otherFormat: '',
    lengthGuidelines: { wordCount: '', sections: '', constraints: '' },
    toneStyle: [], otherTone: '', requiredElements: [], otherElement: '',
    sections: [
      { title: '', points: [''] }  // Initialize with one section and one point
    ],
    specialRequirements: '', technicalRequirements: [], otherTechnical: '',
    platformRequirements: '', versionConsiderations: '',
    examples: ['', '', ''], referenceTypes: [], otherReference: '',
    referenceLinks: ['', '', ''], deliverables: [], otherDeliverable: '',
    timeline: { firstDraft: '', reviewPeriod: '', finalDelivery: '' },
    reviewProcess: [], criticalRequirements: [''],
    qualityStandards: [], otherQuality: '', signoffRequirements: [],
    otherSignoff: '', constraints: '', risks: '', questions: ['', '', '']
  };

  let copied = false;

  function handleCheckboxChange(array: string[], value: string, event: Event) {
    const target = event.target as HTMLInputElement;
    return target.checked ? [...array, value] : array.filter(item => item !== value);
  }

  function addKeyTakeaway() {
    formData.keyTakeaways = [...formData.keyTakeaways, ''];
  }

  function removeKeyTakeaway(index: number) {
    formData.keyTakeaways = formData.keyTakeaways.filter((_, i) => i !== index);
  }

  function addSection() {
    formData.sections = [...formData.sections, { title: '', points: [''] }];
  }

  function removeSection(sectionIndex: number) {
    if (formData.sections.length > 1) {
      formData.sections = formData.sections.filter((_, i) => i !== sectionIndex);
    }
  }

  function addPoint(sectionIndex: number) {
    formData.sections = formData.sections.map((section, i) => {
      if (i === sectionIndex) {
        return {
          ...section,
          points: [...section.points, '']
        };
      }
      return section;
    });
  }

  function removePoint(sectionIndex: number, pointIndex: number) {
    if (formData.sections[sectionIndex].points.length > 1) {
      formData.sections = formData.sections.map((section, i) => {
        if (i === sectionIndex) {
          return {
            ...section,
            points: section.points.filter((_, j) => j !== pointIndex)
          };
        }
        return section;
      });
    }
  }

  function addCriticalRequirement() {
    formData.criticalRequirements = [...formData.criticalRequirements, ''];
  }

  function removeCriticalRequirement(index: number) {
    if (formData.criticalRequirements.length > 1) {
      formData.criticalRequirements = formData.criticalRequirements.filter((_, i) => i !== index);
    }
  }

  function formatOutput(): string {
    return `
# Project Requirements Document

## Project Overview
Project Name: ${formData.projectName}
Client: ${formData.client}
Meeting Date: ${formData.meetingDate}
Stakeholders: ${formData.stakeholders}
Document Type: ${formData.documentType}${formData.otherDocType ? ` - ${formData.otherDocType}` : ''}

## Target Audience
Primary Audience: ${formData.primaryAudience}
Knowledge Level: ${formData.knowledgeLevel.join(', ')}
Specific Roles: ${formData.specificRoles.join(', ')}${formData.otherRole ? `, ${formData.otherRole}` : ''}
Prior Knowledge: ${formData.priorKnowledge}

## Content Purpose
Primary Objective: ${formData.primaryObjective}
Problem Solved: ${formData.problemSolved}
Key Takeaways:
${formData.keyTakeaways.map((t, i) => t ? `${i + 1}. ${t}` : '').filter(Boolean).join('\n')}

Success Metrics: ${formData.successMetrics.join(', ')}${formData.otherMetric ? `, ${formData.otherMetric}` : ''}

## Content Specifications
Format: ${formData.formatRequirements.join(', ')}${formData.otherFormat ? `, ${formData.otherFormat}` : ''}
Length Guidelines:
- Word Count: ${formData.lengthGuidelines.wordCount}
- Sections: ${formData.lengthGuidelines.sections}
- Constraints: ${formData.lengthGuidelines.constraints}

Tone and Style: ${formData.toneStyle.join(', ')}${formData.otherTone ? `, ${formData.otherTone}` : ''}
Required Elements: ${formData.requiredElements.join(', ')}${formData.otherElement ? `, ${formData.otherElement}` : ''}

## Content Structure
${formData.sections.map((s, i) => s.title ? `
${i + 1}. ${s.title}
   ${s.points.map(p => p ? `   • ${p}` : '').filter(Boolean).join('\n')}
` : '').filter(Boolean).join('\n')}

Special Requirements: ${formData.specialRequirements}

## Technical Requirements
Technical Needs: ${formData.technicalRequirements.join(', ')}${formData.otherTechnical ? `, ${formData.otherTechnical}` : ''}
Platform Requirements: ${formData.platformRequirements}
Version Considerations: ${formData.versionConsiderations}

## Examples & References
Examples:
${formData.examples.map((e, i) => e ? `${i + 1}. ${e}` : '').filter(Boolean).join('\n')}

Reference Materials: ${formData.referenceTypes.join(', ')}${formData.otherReference ? `, ${formData.otherReference}` : ''}

Links:
${formData.referenceLinks.map((l, i) => l ? `${i + 1}. ${l}` : '').filter(Boolean).join('\n')}

## Timeline
First Draft: ${formData.timeline.firstDraft}
Review Period: ${formData.timeline.reviewPeriod}
Final Delivery: ${formData.timeline.finalDelivery}

Review Process: ${formData.reviewProcess.join(', ')}

## Acceptance Criteria
Critical Requirements:
${formData.criticalRequirements.map((r, i) => r ? `${i + 1}. ${r}` : '').filter(Boolean).join('\n')}

Quality Standards: ${formData.qualityStandards.join(', ')}${formData.otherQuality ? `, ${formData.otherQuality}` : ''}
Sign-off Requirements: ${formData.signoffRequirements.join(', ')}${formData.otherSignoff ? `, ${formData.otherSignoff}` : ''}

## Additional Notes
Constraints: ${formData.constraints}
Risks/Concerns: ${formData.risks}

Questions:
${formData.questions.map((q, i) => q ? `${i + 1}. ${q}` : '').filter(Boolean).join('\n')}`.trim();
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(formatOutput());
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Project Requirements Form</h1>
  
  <form class="space-y-8">
    <!-- Project Overview -->
    <section class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Project Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each [
          ['projectName', 'Project Name'],
          ['client', 'Client'],
          ['meetingDate', 'Meeting Date', 'date'],
          ['stakeholders', 'Stakeholders Present']
        ] as [id, label, type]}
          <div>
            <label class="block text-sm font-medium mb-1" for={id}>{label}</label>
            <input
              type={type || 'text'}
              {id}
              bind:value={formData[id]}
              class="w-full p-2 border rounded"
            />
          </div>
        {/each}
      </div>
    </section>

    <!-- Document Type -->
    <section class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Document Type</h2>
      <div class="space-y-2">
        {#each ['Article', 'Technical Documentation', 'User Guide', 'Marketing Content', 'Educational Content'] as type}
          <label class="flex items-center">
            <input type="radio" name="documentType" value={type} bind:group={formData.documentType} class="mr-2"/>
            {type}
          </label>
        {/each}
        <div class="flex items-center">
          <input type="radio" name="documentType" value="Other" bind:group={formData.documentType} class="mr-2"/>
          <span class="mr-2">Other:</span>
          <input
            type="text"
            bind:value={formData.otherDocType}
            class="p-1 border rounded"
            disabled={formData.documentType !== 'Other'}
          />
        </div>
      </div>
    </section>

    <!-- Target Audience -->
    <section class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Target Audience</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1" for="primaryAudience">Primary Audience</label>
          <input type="text" id="primaryAudience" bind:value={formData.primaryAudience} class="w-full p-2 border rounded"/>
        </div>

        <div>
          <h3 class="text-md font-medium mb-2">Knowledge Level</h3>
          {#each ['Beginner', 'Intermediate', 'Advanced', 'Technical', 'Non-technical'] as level}
            <label class="flex items-center mb-2">
              <input type="checkbox" value={level}
                on:change={(e) => formData.knowledgeLevel = handleCheckboxChange(formData.knowledgeLevel, level, e)}
                class="mr-2"
              />
              {level}
            </label>
          {/each}
        </div>

        <div>
          <h3 class="text-md font-medium mb-2">Specific Roles</h3>
          {#each ['Decision Makers', 'End Users', 'Technical Users'] as role}
            <label class="flex items-center mb-2">
              <input type="checkbox" value={role}
                on:change={(e) => formData.specificRoles = handleCheckboxChange(formData.specificRoles, role, e)}
                class="mr-2"
              />
              {role}
            </label>
          {/each}
          <div class="flex items-center">
            <span class="mr-2">Other:</span>
            <input type="text" bind:value={formData.otherRole} class="p-1 border rounded"/>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="priorKnowledge">Prior Knowledge</label>
          <textarea id="priorKnowledge" bind:value={formData.priorKnowledge} class="w-full p-2 border rounded h-24"/>
        </div>
      </div>
    </section>

    <!-- Content Purpose -->
    <section class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Content Purpose</h2>
      {#each [
        ['primaryObjective', 'Primary Objective'],
        ['problemSolved', 'What problem does this content solve?']
      ] as [id, label]}
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for={id}>{label}</label>
          <textarea {id} bind:value={formData[id]} class="w-full p-2 border rounded h-24"/>
        </div>
      {/each}

      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <label class="block text-sm font-medium">Key Takeaways</label>
          <button
            type="button"
            on:click={addKeyTakeaway}
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Add Takeaway
          </button>
        </div>
        {#each formData.keyTakeaways as _, i}
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              bind:value={formData.keyTakeaways[i]}
              placeholder={`Takeaway ${i + 1}`}
              class="flex-1 p-2 border rounded"
            />
            {#if formData.keyTakeaways.length > 1}
              <button
                type="button"
                on:click={() => removeKeyTakeaway(i)}
                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Remove
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <div>
        <h3 class="text-md font-medium mb-2">Success Metrics</h3>
        {#each ['Reader Understanding', 'Technical Accuracy', 'SEO Performance'] as metric}
          <label class="flex items-center mb-2">
            <input type="checkbox" value={metric}
              on:change={(e) => formData.successMetrics = handleCheckboxChange(formData.successMetrics, metric, e)}
              class="mr-2"
            />
            {metric}
          </label>
        {/each}
        <div class="flex items-center">
          <span class="mr-2">Other:</span>
          <input type="text" bind:value={formData.otherMetric} class="p-1 border rounded"/>
        </div>
      </div>
    </section>

    <!-- Content Structure -->
    <section class="bg-white p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Content Structure</h2>
        <button
          type="button"
          on:click={addSection}
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
        >
          Add Section
        </button>
      </div>
  
      {#each formData.sections as section, sectionIndex}
        <div class="mb-8 p-4 border rounded-lg bg-gray-50">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1 mr-4">
              <label class="block text-sm font-medium mb-1">
                Section {sectionIndex + 1} Title
              </label>
              <input
                type="text"
                bind:value={section.title}
                placeholder="Section Title"
                class="w-full p-2 border rounded"
              />
            </div>
            {#if formData.sections.length > 1}
              <button
                type="button"
                on:click={() => removeSection(sectionIndex)}
                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm mt-6"
              >
                Remove Section
              </button>
            {/if}
          </div>
  
          <div class="ml-4">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium">Points</label>
              <button
                type="button"
                on:click={() => addPoint(sectionIndex)}
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Add Point
              </button>
            </div>
  
            {#each section.points as point, pointIndex}
              <div class="flex gap-2 mb-2">
                <input
                  type="text"
                  bind:value={section.points[pointIndex]}
                  placeholder={`Point ${pointIndex + 1}`}
                  class="flex-1 p-2 border rounded"
                />
                {#if section.points.length > 1}
                  <button
                    type="button"
                    on:click={() => removePoint(sectionIndex, pointIndex)}
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </section>

    <!-- Technical Requirements & Timeline -->
    <section class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Technical Requirements & Timeline</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-md font-medium mb-2">Technical Requirements</h3>
          {#each ['SME Review', 'Technical Examples', 'Code Samples', 'API Docs'] as req}
            <label class="flex items-center mb-2">
              <input type="checkbox" value={req}
                on:change={(e) => formData.technicalRequirements = handleCheckboxChange(formData.technicalRequirements, req, e)}
                class="mr-2"
              />
              {req}
            </label>
          {/each}
        </div>
        <div>
          <h3 class="text-md font-medium mb-2">Timeline</h3>
          {#each [
            ['firstDraft', 'First Draft Due', 'date'],
            ['finalDelivery', 'Final Delivery', 'date']
          ] as [id, label, type]}
            <div class="mb-2">
              <label class="block text-sm font-medium mb-1">{label}</label>
              <input
                type={type}
                bind:value={formData.timeline[id]}
                class="w-full p-2 border rounded"
              />
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Acceptance Criteria -->
    <section class="bg-white p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Acceptance Criteria</h2>
        <button
          type="button"
          on:click={addCriticalRequirement}
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
        >
          Add Requirement
        </button>
      </div>
  
      <div class="space-y-3">
        {#each formData.criticalRequirements as _, i}
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={formData.criticalRequirements[i]}
              placeholder={`Requirement ${i + 1}`}
              class="flex-1 p-2 border rounded"
            />
            {#if formData.criticalRequirements.length > 1}
              <button
                type="button"
                on:click={() => removeCriticalRequirement(i)}
                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Remove
              </button>
            {/if}
          </div>
        {/each}
      </div>  

    <!-- Additional Notes -->
    <section class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Additional Notes</h2>
      {#each [
        ['constraints', 'Constraints'],
        ['risks', 'Risks/Concerns']
      ] as [id, label]}
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for={id}>{label}</label>
          <textarea {id} bind:value={formData[id]} class="w-full p-2 border rounded h-24"/>
        </div>
      {/each}
    </section>

    <div class="fixed bottom-6 right-6">
      <button
        type="button"
        on:click={copyToClipboard}
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transition-colors"
      >
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  </form>
</div>