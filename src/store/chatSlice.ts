import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  component?: 'url-form' | 'confirmation' | 'recommendations';
}

interface ChatState {
  messages: Message[];
  websiteData: {
    url: string;
    contentThemes: string[];
    audienceInterests: string[];
    postingFrequency: string;
    topPerformingContent: string;
    audienceLocation: string;
    preferredDestinations: string[];
  } | null;
}

const initialState: ChatState = {
  messages: [
    {
      id: '1',
      text: "Hello! I'm your AI travel companion. I'll analyze your website and recommend perfect travel destinations for content creation. Let's start by getting your website URL.",
      isBot: true,
      timestamp: new Date(),
      component: 'url-form',
    },
  ],
  websiteData: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    setWebsiteData(state, action: PayloadAction<ChatState['websiteData']>) {
      state.websiteData = action.payload;
    },
    resetChat(state) {
      state.messages = initialState.messages;
      state.websiteData = null;
    },
  },
});

export const { addMessage, setWebsiteData, resetChat } = chatSlice.actions;
export default chatSlice.reducer;
