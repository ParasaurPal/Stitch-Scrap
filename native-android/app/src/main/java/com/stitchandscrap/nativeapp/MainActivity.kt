package com.stitchandscrap.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.stitchandscrap.nativeapp.ui.AppRoot
import com.stitchandscrap.nativeapp.ui.theme.StitchAndScrapTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StitchAndScrapTheme {
                AppRoot()
            }
        }
    }
}
