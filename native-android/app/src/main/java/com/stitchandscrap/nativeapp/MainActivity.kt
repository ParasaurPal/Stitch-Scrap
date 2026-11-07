package com.stitchandscrap.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.stitchandscrap.nativeapp.data.ScrapbookRepository
import com.stitchandscrap.nativeapp.ui.AppRoot
import com.stitchandscrap.nativeapp.ui.AppViewModel
import com.stitchandscrap.nativeapp.ui.AppViewModelFactory
import com.stitchandscrap.nativeapp.ui.theme.StitchAndScrapTheme

class MainActivity : ComponentActivity() {
    private val repo by lazy { ScrapbookRepository(applicationContext) }
    private val vm: AppViewModel by viewModels { AppViewModelFactory(repo, applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StitchAndScrapTheme {
                AppRoot(vm)
            }
        }
    }
}
